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


@Injectable()

export class PollingService {
  constructor(public authService: AuthService) { }
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
    polling.name = body.name;
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
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.polling_id);

    return true;
  }

  public async getPollingSummary(pollingId: number): Promise<string> {
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
      .getRawMany()
    this.logger.warn('stringify', JSON.stringify(result));
    this.logger.warn('result note', result[0].note);
    return ''
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
    this.logger.warn('parse', JSON.parse(JSON.stringify(body)));
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

}
