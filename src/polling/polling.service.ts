import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NamingStrategyNotFoundError, Repository } from 'typeorm';
import { AddPollingCandidateDto, CreatePollingDto, DeletePollingDto, EditPollingDto, RemovePollingCandidateDto } from './polling.dto';
import { Polling } from './polling.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { PollingNotesService } from 'src/polling_notes/polling_notes.service';
import { PollingNotes } from 'src/polling_notes/polling_notes.entity';
import { Candidate } from 'src/candidate/candidate.entity';
import { Member } from 'src/member/member.entity';
import { PollingCandidate } from './polling_candidate.entity';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service'
import { PollingOrder } from 'src/polling_order/polling_order.entity';
import { MemberService } from 'src/member/member.service';

@Injectable()

export class PollingService {
  constructor(public authService: AuthService, public typeOrmConfigService: TypeOrmConfigService, public pollingNotesService: PollingNotesService, @Inject(MemberService) public memberService: MemberService) { }
  private readonly logger = new Logger(PollingService.name)
  @InjectRepository(Polling)
  @InjectRepository(PollingNotes)
  @InjectRepository(Candidate)
  @InjectRepository(Member)
  @InjectRepository(PollingCandidate)
  @InjectRepository(PollingOrder)

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
      polling_name: body.name,
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
        .then(() =>
          newdata.createQueryBuilder()
            .delete()
            .from(PollingCandidate)
            .where('polling_id = :pollingId', { pollingId })
            .execute()
            .then(() =>
              this.repository.delete(body.polling_id)
            ))
    );

    return true;
  }

  /*   public async getPollingSummary(pollingId: number): Promise<any> {
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
        .getSql()
      return result;
    }
   */

  public async getPollingReport(pollingOrderId: number): Promise<any> {
    let result = {};
    let polling_id = 0;
    let endDate = new Date();

    await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .addSelect('t2.*', 'pollingOrder')
      .innerJoin(PollingOrder, 't2', 't1.polling_order_id = t2.polling_order_id')
      .where('t1.polling_order_id = :pollingOrderId', { pollingOrderId })
      .andWhere('CURRENT_DATE > t1.end_date')
      .orderBy('t1.end_date', 'DESC')
      .limit(1)
      .getRawMany()
      .then(async (data) => {
        if (data.length > 0) {
          polling_id = data[0]?.polling_id
          let endDate = new Date(data[0]?.end_date);
        }
        const result2 = await this.repository
          .createQueryBuilder('t1')
          .select('count(t1.*)', 'active_members')
          .innerJoin(Member, 't2', 't1.polling_order_id = t2.polling_order_id')
          .where('t1.polling_order_id = :pollingOrderId', { pollingOrderId })
          .andWhere('t1.polling_id = :polling_id', { polling_id })
          .andWhere('t2.pom_created_at <= :endDate', { endDate })
          .andWhere('t2.active=true')
          .andWhere('t2.removed=false')
          .getRawMany()
        data.push(result2);
        return data;
      })
      .then(async (dataFinal) => {
        const result3 = await this.pollingNotesService.getPollingReportMemberParticipation(polling_id);
        dataFinal.push(result3);
        result = dataFinal.flat();
      })
    return result;
  }

  public async getInProcessPollingReport(pollingOrderId: number): Promise<any> {
    let result = {};
    let polling_id = 0;
    let endDate = new Date();

    const date = new Date()
    const today = date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .addSelect('t2.*', 'pollingOrder')
      .innerJoin(PollingOrder, 't2', 't1.polling_order_id = t2.polling_order_id')
      .where('t1.polling_order_id = :pollingOrderId', { pollingOrderId })
      .andWhere(':today >= t1.start_date', { today })
      .andWhere(':today <= t1.end_date', { today })
      .orderBy('t1.end_date', 'DESC')
      .limit(1)
      .getRawMany()
      .then(async (data) => {
        if (data.length > 0) {
          polling_id = data[0]?.polling_id
          let endDate = new Date(data[0]?.end_date).toString();
        }
        const result2 = await this.repository
          .createQueryBuilder('t1')
          .select('count(t1.*)', 'active_members')
          .innerJoin(Member, 't2', 't1.polling_order_id = t2.polling_order_id')
          .where('t1.polling_order_id = :pollingOrderId', { pollingOrderId })
          .andWhere('t1.polling_id = :polling_id', { polling_id })
          .andWhere('t2.pom_created_at <= :endDate', { endDate })
          .andWhere('t2.active=true')
          .andWhere('t2.removed=false')
          .getRawMany()
        data.push(result2);
        return data;
      })
      .then(async (dataFinal) => {
        const result3 = await this.pollingNotesService.getPollingReportMemberParticipation(polling_id);
        dataFinal.push(result3);
        result = dataFinal.flat();
      })
    return result;
  }

  public async getPollingSummary(pollingId: number, orderMemberId: number): Promise<any> {
    let result = {};
    await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .select('t2.*', 'pollingcandidates')
      .addSelect('t3.*', 'candidate')
      .addSelect('t4.*', 'pollingnotes')
      .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
      .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
      .leftJoin(PollingNotes, 't4', 't1.polling_id = t4.polling_id')
      .where('t1.polling_id = :pollingId', { pollingId })
      .andWhere('t4.candidate_id = t2.candidate_id')
      .andWhere('t4.polling_order_member_id = :orderMemberId', { orderMemberId })
      .getRawMany()
      .then(async (data) => {
        let candidateIds = [0];
        if (data.length > 0) {
          candidateIds = data.map(d => d.candidate_id);
        }
        const result2 = await this.repository
          .createQueryBuilder('t1')
          .select('t1.*', 'polling')
          .addSelect('t2.*', 'pollingcandidates')
          .addSelect('t3.*', 'candidate')
          .addSelect('null', 'polling_notes_id')
          .addSelect('null', 'note')
          .addSelect('null', 'vote')
          .addSelect('null', 'pn_created_at')
          .addSelect('null', 'polling_order_member_id')
          .addSelect('false', 'completed')
          .addSelect('false', 'private')
          .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
          .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
          .where('t1.polling_id = :pollingId', { pollingId })
          .andWhere('t3.candidate_id not in (' + candidateIds + ')')
          .getRawMany()
        data.push(result2);
        result = data.flat();
      })
    return result;
  }

  //Server and Database should be in UTC time, which would set this to eastern time zone
  public async getCurrentPolling(orderId: number): Promise<any> {
    const today = new Date();
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t1.*', 'polling')
      .where('t1.polling_order_id = :orderId', { orderId })
      .andWhere('now() >= "t1"."start_date" + time \'05:00:00\'')
      .andWhere('now() <= "t1"."end_date" + 1 + time \'05:00:00\'')
      .getRawOne()
    return result;
  }

  public async getPollingNotesByCandidateId(candidateId: number, authorization: string): Promise<Polling[]> {
    let isOrderAdmin = false;
    authorization = authorization.replace('Bearer ', '');
    if (this.authService.isOrderAdmin(authorization)) {
      isOrderAdmin = true;
    }

    const result = await this.repository
      .createQueryBuilder('polling')
      .select('pollingorder.polling_order_notes_time_visible as pv')
      .innerJoin(PollingOrder, 'pollingorder', 'polling.polling_order_id = pollingorder.polling_order_id')
      .innerJoin(PollingCandidate, 'pollingcandidate', 'polling.polling_id = pollingcandidate.polling_id')
      .innerJoin(Candidate, 'candidate', 'pollingcandidate.candidate_id = candidate.candidate_id')
      .where('candidate.candidate_id = :candidateId', { candidateId })
      .limit(1)
      .getRawMany()
      .then(async (data) => {
        let cutOffDate = new Date();
        if (data[0] && data[0].pv) {
          cutOffDate.setMonth(cutOffDate.getMonth() - data[0].pv);
        }
        let resultFinal;
        if (isOrderAdmin) {
          resultFinal = await this.repository
            .createQueryBuilder('t1')
            .select('t1.*', 'polling')
            .addSelect('t2.*', 'pollingcandidates')
            .addSelect('t3.*', 'candidate')
            .addSelect('t4.*', 'pollingnotes')
            .addSelect('t5.*', 'pollingordermember')
            .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
            .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
            .innerJoin(PollingNotes, 't4', 't1.polling_id = t4.polling_id')
            .innerJoin(Member, 't5', 't4.polling_order_member_id = t5.polling_order_member_id')
            .where('t3.candidate_id = :candidateId', { candidateId })
            .andWhere('t4.candidate_id = :candidateId', { candidateId })
            .andWhere('t4.pn_created_At > :cutOffDate', { cutOffDate })
            .andWhere('t4.completed = true')
            .orderBy('pn_created_at', 'DESC')
            .getRawMany()
        } else {
          resultFinal = await this.repository
            .createQueryBuilder('t1')
            .select('t1.*', 'polling')
            .addSelect('t2.*', 'pollingcandidates')
            .addSelect('t3.*', 'candidate')
            .addSelect('t4.*', 'pollingnotes')
            .addSelect('t5.*', 'pollingordermember')
            .innerJoin(PollingCandidate, 't2', 't1.polling_id = t2.polling_id')
            .innerJoin(Candidate, 't3', 't2.candidate_id = t3.candidate_id')
            .innerJoin(PollingNotes, 't4', 't1.polling_id = t4.polling_id')
            .innerJoin(Member, 't5', 't4.polling_order_member_id = t5.polling_order_member_id')
            .where('t3.candidate_id = :candidateId', { candidateId })
            .andWhere('t4.candidate_id = :candidateId', { candidateId })
            .andWhere('t4.pn_created_At > :cutOffDate', { cutOffDate })
            .andWhere('t4.private = false')
            .andWhere('t4.completed = true')
            .orderBy('pn_created_at', 'DESC')
            .getRawMany()
        }

        return resultFinal;
      })
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

  /**
   * Returns, for the most recent N pollings in a polling order, the members who did NOT submit a vote.
   */
  public async getMissingVotesReport(orderId: number, count: number): Promise<any[]> {
    // 1. Get the most recent N pollings for the order
    const pollingsAvailable = await this.repository
      .createQueryBuilder('polling')
      .where('polling.polling_order_id = :orderId', { orderId })
      .orderBy('polling.end_date', 'DESC')
      .limit(count)
      .getMany();

    // 2. Get all members for the polling order
    const allMembers = (await this.memberService.getAllMembers(orderId)).filter(m => m.active);
    const allMemberIds = allMembers.map(m => m.polling_order_member_id);

    this.logger.log(allMembers);

    // 3. For each polling, get all members who submitted a vote (completed=true)
    const missingByPolling: { [memberId: number]: number } = {};
    const pollingResults = [];
    for (const polling of pollingsAvailable) {
      const notes = await this.pollingNotesService['repository']
        .createQueryBuilder('note')
        .select('DISTINCT note.polling_order_member_id', 'polling_order_member_id')
        .where('note.polling_id = :pollingId', { pollingId: polling.polling_id })
        .andWhere('note.completed = true')
        .getRawMany();
      const votedMemberIds = notes.map(n => n.polling_order_member_id);
      const missingMembers = allMembers.filter(m => !votedMemberIds.includes(m.polling_order_member_id));
      // Count how many times each member is missing
      for (const member of missingMembers) {
        missingByPolling[member.polling_order_member_id] = (missingByPolling[member.polling_order_member_id] || 0) + 1;
      }
      pollingResults.push({
        polling_id: polling.polling_id,
        polling_name: polling.polling_name,
        missing_members: missingMembers
      });
    }
    // Only include members who are missing from ALL pollings
    const missingAllMembers = allMembers.filter(m => missingByPolling[m.polling_order_member_id] === pollingsAvailable.length);
    return [{
      pollings: pollingsAvailable.map(p => ({ polling_id: p.polling_id, polling_name: p.polling_name })),
      missing_in_all: missingAllMembers
    }];
  }

}
