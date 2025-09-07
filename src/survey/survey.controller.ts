import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto, UpdateSurveyDto, SubmitSurveyResponseDto, SurveyDto, SurveyResponseDto } from './survey.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';

@Controller('surveys')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async createSurvey(@Body() createSurveyDto: CreateSurveyDto, @Req() request: Request): Promise<SurveyDto> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    const survey = await this.surveyService.createSurvey(createSurveyDto, memberId);
    return await this.surveyService.getSurveyResults(survey.survey_id, memberId);
  }

  // Removed getAllSurveys endpoint - members should only see surveys from their own polling order

  @Get('polling-order/:pollingOrderId')
  async getSurveysByPollingOrder(
    @Param('pollingOrderId', ParseIntPipe) pollingOrderId: number,
    @Req() request: Request
  ): Promise<SurveyDto[]> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    const surveys = await this.surveyService.getSurveysByPollingOrder(pollingOrderId, memberId);
    const results: SurveyDto[] = [];
    
    for (const survey of surveys) {
      results.push(await this.surveyService.getSurveyResults(survey.survey_id, memberId));
    }
    
    return results;
  }

  @Get('active')
  async getActiveSurveys(
    @Req() request: Request,
    @Query('pollingOrderId') pollingOrderId?: string
  ): Promise<SurveyDto[]> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    const orderId = pollingOrderId ? parseInt(pollingOrderId) : undefined;
    const surveys = await this.surveyService.getActiveSurveys(memberId, orderId);
    const results: SurveyDto[] = [];
    
    for (const survey of surveys) {
      results.push(await this.surveyService.getSurveyResults(survey.survey_id, memberId));
    }
    
    return results;
  }

  @Get(':id')
  async getSurveyById(@Param('id', ParseIntPipe) id: number, @Req() request: Request): Promise<SurveyDto> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    return await this.surveyService.getSurveyResults(id, memberId);
  }

  @Put(':id')
  async updateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSurveyDto: UpdateSurveyDto,
    @Req() request: Request
  ): Promise<SurveyDto> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    await this.surveyService.updateSurvey(id, updateSurveyDto, memberId);
    return await this.surveyService.getSurveyResults(id, memberId);
  }

  @Delete(':id')
  async deleteSurvey(@Param('id', ParseIntPipe) id: number, @Req() request: Request): Promise<{ message: string }> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    await this.surveyService.deleteSurvey(id, memberId);
    return { message: 'Survey deleted successfully' };
  }

  @Post('responses')
  async submitSurveyResponse(@Body() responseDto: SubmitSurveyResponseDto, @Req() request: Request): Promise<SurveyResponseDto> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    const response = await this.surveyService.submitSurveyResponse(responseDto);
    const responses = await this.surveyService.getSurveyResponses(response.survey_id, memberId);
    return responses.find(r => r.response_id === response.response_id)!;
  }

  @Get(':id/responses')
  async getSurveyResponses(@Param('id', ParseIntPipe) id: number, @Req() request: Request): Promise<SurveyResponseDto[]> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    return await this.surveyService.getSurveyResponses(id, memberId);
  }

  @Get(':id/results')
  async getSurveyResults(@Param('id', ParseIntPipe) id: number, @Req() request: Request): Promise<SurveyDto> {
    const memberId = this.authService.getPollingOrderMemberId(request.headers.authorization);
    return await this.surveyService.getSurveyResults(id, memberId);
  }

  @Get(':surveyId/member/:memberId/response')
  async getMemberSurveyResponse(
    @Param('surveyId', ParseIntPipe) surveyId: number,
    @Param('memberId', ParseIntPipe) memberId: number
  ): Promise<SurveyResponseDto | null> {
    const response = await this.surveyService.getMemberSurveyResponse(surveyId, memberId);
    
    if (!response) {
      return null;
    }

    return {
      response_id: response.response_id,
      survey_id: response.survey_id,
      polling_order_member_id: response.polling_order_member_id,
      answer: response.answer,
      submitted_at: response.submitted_at,
      member_name: response.member?.name,
      member_email: response.member?.email
    };
  }
}
