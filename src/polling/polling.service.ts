import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddPollingCandidateDto, CreatePollingDto, DeletePollingDto, EditPollingDto, RemovePollingCandidateDto } from './polling.dto';
import { Polling } from './polling.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { PollingNotes } from 'src/polling_notes/polling_notes.entity';
import { Candidate } from 'src/candidate/candidate.entity';
import { Member } from 'src/member/member.entity';
import { PollingCandidate } from './polling_candidate.entity';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service'

@Injectable()

export class PollingService {
  constructor(public authService: AuthService, public typeOrmConfigService:TypeOrmConfigService) { }
  private readonly logger = new Logger(PollingService.name)
  @InjectRepository(Polling)
  @InjectRepository(PollingNotes)
  @InjectRepository(Candidate)
  @InjectRepository(Member)
  @InjectRepository(PollingCandidate)

  private readonly repository: Repository<Polling>;

  public getPollingById(id: number): Promise<Polling> {
    return this.repository.findOneBy({
      polling_id: id
    });
  }

  public async createPolling(body: CreatePollingDto): Promise<Polling> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const polling: Polling = new Polling();
    polling.polling_name = body.name;
    polling.start_date = new Date(body.start_date);
    polling.end_date = new Date(body.end_date);
    polling.polling_order_id = body.polling_order_id;
    return this.repository.save(polling);
  }

  public async editPolling(body: EditPollingDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date
    }
    await this.repository.update(body.polling_id, bodyUpdate);
    return true;
  }

  public async deletePolling(body: DeletePollingDto): Promise<boolean> {
    let pollingId = body.polling_id; 
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    let data = this.typeOrmConfigService.workDataSource();
    data.initialize().then(newdata => 
      newdata.createQueryBuilder()
      .delete()
      .from(PollingNotes)
      .where('polling_id = :pollingId', { pollingId })
      .execute()
      .then(()=> 
      newdata.createQueryBuilder()
      .delete()
      .from(PollingCandidate)
      .where('polling_id = :pollingId', { pollingId })
      .execute()
      .then(()=> 
      this.repository.delete(body.polling_id)
      ))
    );

    return true;
  }

  public async getPollingSummary(pollingId: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .addSelect('t2.*', 'pollingcandidates')
      .addSelect('t3.*', 'candidate')
      .addSelect('t4.*', 'pollingnotes')
      .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
      .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
      .leftJoin(PollingNotes, 't4', 't1.polling_id = t2.polling_id')
      .where('t1.polling_id = :pollingId', { pollingId }) 
      .andWhere('t4.candidate_id = t2.candidate_id') 
      .getRawMany()
    return result;
  }

  public async getCurrentPolling(orderId: number): Promise<any> {
    const today = new Date();
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .where('t1.polling_order_id = :orderId', { orderId })
      .andWhere('CURRENT_DATE BETWEEN "t1"."start_date" AND "t1"."end_date"') 
      .getRawOne()
    return result;
  }

  public async getPollingNotesByCandidateId(candidateId: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .addSelect('t2.*', 'pollingcandidates')
      .addSelect('t3.*', 'candidate')
      .addSelect('t4.*', 'pollingnotes')
      .addSelect('t5.*', 'pollingordermember')
      .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
      .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
      .innerJoin(PollingNotes, 't4', 't1.polling_id = t2.polling_id')
      .innerJoin(Member, 't5', 't4.polling_order_member_id = t5.polling_order_member_id')
      .where('t3.candidate_id = :candidateId', { candidateId }) 
      .andWhere('t4.candidate_id = :candidateId', { candidateId }) 
      .orderBy('pn_created_at')
      .getRawMany()
    return result;
  }


  public async addPollingCandidates(body: AddPollingCandidateDto[]): Promise<PollingCandidate[]> {
    if (!this.authService.isOrderAdmin(body[0].authToken)) {
      throw new UnauthorizedException();
    }
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(PollingCandidate)
      .values(body)
      .execute()  
      return result.raw;
  }

  public async removePollingCandidate(body: RemovePollingCandidateDto): Promise<boolean> {

    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }

    const polling_candidate_id = body.polling_candidate_id;
      await this.repository
      .createQueryBuilder()
      .delete()
      .from(PollingCandidate)
      .where('polling_candidate_id = :polling_candidate_id', { polling_candidate_id }) // WHERE t3.event = 2019
      .execute()  

    return true;
  }

  public async getAllPollings(orderId: number): Promise<Polling[]> {
    const result = await this.repository
      .createQueryBuilder('polling')
      .select(['polling'])
      .where('polling.polling_order_id = :orderId', { orderId })
      .orderBy('polling_name')
      .getMany();
    return result;
  }



}
