import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyResponse } from './survey_response.entity';
import { CreateSurveyDto, UpdateSurveyDto, SubmitSurveyResponseDto, SurveyDto, SurveyResponseDto } from './survey.dto';
import { Member as PollingOrderMember } from '../member/member.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyResponse)
    private surveyResponseRepository: Repository<SurveyResponse>,
    @InjectRepository(PollingOrderMember)
    private memberRepository: Repository<PollingOrderMember>,
    @InjectRepository(PollingOrder)
    private pollingOrderRepository: Repository<PollingOrder>,
  ) {}

  async createSurvey(createSurveyDto: CreateSurveyDto, memberId: number): Promise<Survey> {
    const { start_date, end_date, polling_order_id } = createSurveyDto;
    
    // Verify member is admin or admin assistant for this polling order
    const member = await this.memberRepository.findOne({
      where: { 
        polling_order_member_id: memberId,
        polling_order_id: polling_order_id,
        active: true,
        removed: false
      }
    });

    if (!member) {
      throw new ForbiddenException('Member not found or not authorized for this polling order');
    }

    // Check if member is admin or admin assistant
    const pollingOrder = await this.pollingOrderRepository.findOne({
      where: { polling_order_id: polling_order_id }
    });

    if (!pollingOrder) {
      throw new NotFoundException('Polling order not found');
    }

    if (memberId !== pollingOrder.polling_order_admin && memberId !== pollingOrder.polling_order_admin_assistant) {
      throw new ForbiddenException('Only polling order administrators can create surveys');
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestException('End date must be after start date');
    }

    const survey = this.surveyRepository.create(createSurveyDto);
    return await this.surveyRepository.save(survey);
  }

  // Removed getAllSurveys() - members should only see surveys from their own polling order

  async getSurveysByPollingOrder(pollingOrderId: number, memberId: number): Promise<Survey[]> {
    // Verify member belongs to this polling order
    const member = await this.memberRepository.findOne({
      where: { 
        polling_order_member_id: memberId,
        polling_order_id: pollingOrderId,
        active: true,
        removed: false
      }
    });

    if (!member) {
      throw new ForbiddenException('Member not authorized to access surveys from this polling order');
    }

    return await this.surveyRepository.find({
      where: { polling_order_id: pollingOrderId },
      relations: ['pollingOrder', 'creator'],
      order: { created_at: 'DESC' }
    });
  }

  async getSurveyById(surveyId: number, memberId: number): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({
      where: { survey_id: surveyId },
      relations: ['pollingOrder', 'creator', 'responses.member']
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${surveyId} not found`);
    }

    // Verify member belongs to this survey's polling order
    const member = await this.memberRepository.findOne({
      where: { 
        polling_order_member_id: memberId,
        polling_order_id: survey.polling_order_id,
        active: true,
        removed: false
      }
    });

    if (!member) {
      throw new ForbiddenException('Member not authorized to access this survey');
    }

    return survey;
  }

  async updateSurvey(surveyId: number, updateSurveyDto: UpdateSurveyDto, memberId: number): Promise<Survey> {
    const survey = await this.getSurveyById(surveyId, memberId);
    
    // Check if member is admin or admin assistant for this polling order
    const pollingOrder = await this.pollingOrderRepository.findOne({
      where: { polling_order_id: survey.polling_order_id }
    });

    if (!pollingOrder) {
      throw new NotFoundException('Polling order not found');
    }

    if (memberId !== pollingOrder.polling_order_admin && memberId !== pollingOrder.polling_order_admin_assistant) {
      throw new ForbiddenException('Only polling order administrators can update surveys');
    }
    
    if (updateSurveyDto.start_date && updateSurveyDto.end_date) {
      if (new Date(updateSurveyDto.start_date) >= new Date(updateSurveyDto.end_date)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    Object.assign(survey, updateSurveyDto);
    return await this.surveyRepository.save(survey);
  }

  async deleteSurvey(surveyId: number, memberId: number): Promise<void> {
    const survey = await this.getSurveyById(surveyId, memberId);
    
    // Check if member is admin or admin assistant for this polling order
    const pollingOrder = await this.pollingOrderRepository.findOne({
      where: { polling_order_id: survey.polling_order_id }
    });

    if (!pollingOrder) {
      throw new NotFoundException('Polling order not found');
    }

    if (memberId !== pollingOrder.polling_order_admin && memberId !== pollingOrder.polling_order_admin_assistant) {
      throw new ForbiddenException('Only polling order administrators can delete surveys');
    }
    
    await this.surveyRepository.remove(survey);
  }

  async submitSurveyResponse(responseDto: SubmitSurveyResponseDto): Promise<SurveyResponse> {
    const { survey_id, polling_order_member_id, answer } = responseDto;

    // Check if survey exists and is active
    const survey = await this.getSurveyById(survey_id, polling_order_member_id);
    const now = new Date();
    
    if (now < survey.start_date) {
      throw new BadRequestException('Survey has not started yet');
    }
    
    if (now > survey.end_date) {
      throw new BadRequestException('Survey has already ended');
    }

    // Check if member exists and is part of the polling order
    const member = await this.memberRepository.findOne({
      where: { 
        polling_order_member_id,
        polling_order_id: survey.polling_order_id,
        active: true,
        removed: false
      }
    });

    if (!member) {
      throw new ForbiddenException('Member not found or not authorized for this survey');
    }

    // Check if member has already responded
    const existingResponse = await this.surveyResponseRepository.findOne({
      where: { survey_id, polling_order_member_id }
    });

    if (existingResponse) {
      // Update existing response
      existingResponse.answer = answer;
      existingResponse.submitted_at = new Date();
      return await this.surveyResponseRepository.save(existingResponse);
    }

    // Create new response
    const response = this.surveyResponseRepository.create(responseDto);
    return await this.surveyResponseRepository.save(response);
  }

  async getSurveyResponses(surveyId: number, memberId: number): Promise<SurveyResponseDto[]> {
    // Verify member has access to this survey
    await this.getSurveyById(surveyId, memberId);
    
    const responses = await this.surveyResponseRepository.find({
      where: { survey_id: surveyId },
      relations: ['member'],
      order: { submitted_at: 'ASC' }
    });

    return responses.map(response => ({
      response_id: response.response_id,
      survey_id: response.survey_id,
      polling_order_member_id: response.polling_order_member_id,
      answer: response.answer,
      submitted_at: response.submitted_at,
      member_name: response.member?.name,
      member_email: response.member?.email
    }));
  }

  async getSurveyResults(surveyId: number, memberId: number): Promise<SurveyDto> {
    const survey = await this.getSurveyById(surveyId, memberId);
    const responses = await this.surveyResponseRepository.find({
      where: { survey_id: surveyId }
    });

    const now = new Date();
    let status: 'pending' | 'active' | 'closed' = 'pending';
    
    if (now >= survey.start_date && now <= survey.end_date) {
      status = 'active';
    } else if (now > survey.end_date) {
      status = 'closed';
    }

    const yes_votes = responses.filter(r => r.answer === 'yes').length;
    const no_votes = responses.filter(r => r.answer === 'no').length;
    const abstain_votes = responses.filter(r => r.answer === 'abstain').length;

    return {
      survey_id: survey.survey_id,
      polling_order_id: survey.polling_order_id,
      question: survey.question,
      start_date: survey.start_date,
      end_date: survey.end_date,
      created_at: survey.created_at,
      created_by: survey.created_by,
      creator_name: survey.creator?.name,
      total_responses: responses.length,
      yes_votes,
      no_votes,
      abstain_votes,
      status
    };
  }

  async getActiveSurveys(memberId: number, pollingOrderId?: number): Promise<Survey[]> {
    const now = new Date();
    const whereClause: any = {
      start_date: LessThan(now),
      end_date: MoreThan(now)
    };

    if (pollingOrderId) {
      // Verify member belongs to this polling order
      const member = await this.memberRepository.findOne({
        where: { 
          polling_order_member_id: memberId,
          polling_order_id: pollingOrderId,
          active: true,
          removed: false
        }
      });

      if (!member) {
        throw new ForbiddenException('Member not authorized to access surveys from this polling order');
      }
      
      whereClause.polling_order_id = pollingOrderId;
    } else {
      // If no polling order specified, get active surveys from member's polling order
      const member = await this.memberRepository.findOne({
        where: { 
          polling_order_member_id: memberId,
          active: true,
          removed: false
        }
      });

      if (!member) {
        throw new ForbiddenException('Member not found or inactive');
      }
      
      whereClause.polling_order_id = member.polling_order_id;
    }

    return await this.surveyRepository.find({
      where: whereClause,
      relations: ['pollingOrder', 'creator'],
      order: { end_date: 'ASC' }
    });
  }

  async getMemberSurveyResponse(surveyId: number, memberId: number): Promise<SurveyResponse | null> {
    return await this.surveyResponseRepository.findOne({
      where: { survey_id: surveyId, polling_order_member_id: memberId },
      relations: ['member']
    });
  }
}
