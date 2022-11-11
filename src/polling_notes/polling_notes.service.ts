import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollingNoteDto, DeletePollingNoteDto, EditPollingNoteDto } from './polling_notes.dto';
import { PollingNotes } from './polling_notes.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';
import { Candidate } from 'src/candidate/candidate.entity';

@Injectable()

export class PollingNotesService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(PollingNotesService.name)
  @InjectRepository(PollingNotes)
  @InjectRepository(PollingOrder)

  private readonly repository: Repository<PollingNotes>;

  public getPollingNoteById(id: number): Promise<PollingNotes> {
    return this.repository.findOneBy({
      polling_id: id
    });
  }

  public async createPollingNote(body: CreatePollingNoteDto[]): Promise<boolean> {
    const memberID = this.authService.getPollingOrderMemberId(body[0].authToken);
    let finished = 0;

    body.forEach(x => {
      let pollingNote: PollingNotes = new PollingNotes;
      if (x?.note?.length > 0) {
        pollingNote.note = x.note;
      }

      if (x?.polling_notes_id !== null) {
        pollingNote.polling_notes_id = x.polling_notes_id;
        pollingNote.vote = x.vote;
        pollingNote.polling_id = x.polling_id;
        pollingNote.candidate_id = x.candidate_id;
        pollingNote.polling_order_id = x.polling_order_id;
        pollingNote.polling_order_member_id = memberID;
        pollingNote.completed = x.completed;
        pollingNote.private = x.private;
        this.repository.update(pollingNote.polling_notes_id, pollingNote);
      } else {
        pollingNote.polling_notes_id = x?.polling_notes_id;
        pollingNote.vote = x.vote;
        pollingNote.polling_id = x.polling_id;
        pollingNote.candidate_id = x.candidate_id;
        pollingNote.polling_order_id = x.polling_order_id;
        pollingNote.polling_order_member_id = memberID;
        pollingNote.completed = x.completed;
        pollingNote.private = x.private;
        this.repository.save(pollingNote);
      }
      finished++;
    })
    if (finished === body.length) {
      return true;
    }
  }

  public async editPollingNote(body: EditPollingNoteDto, isRecordOwner: number): Promise<boolean> {
    if (!this.authService.isRecordOwner(body.authToken, isRecordOwner)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      note: body.note,
      vote: body.vote,
      candidate_id: body.candidate_id,
      completed: body.completed
    }
    await this.repository.update(body.polling_notes_id, bodyUpdate);
    return true;
  }

  public async deletePollingNote(body: DeletePollingNoteDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.polling_notes_id);

    return true;
  }

  public async getPollingReportTotals(pollingId: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('t2.name, t2.candidate_id, CASE WHEN vote=1 THEN \'Yes\' WHEN vote=2 THEN \'Wait\' WHEN vote=3 THEN \'No\' WHEN vote=4 THEN \'Abstain\' ELSE \'Null\' END as vote, count(polling_notes_id) AS TOTAL')
      .addSelect('t2.*', 'Candidate')
      .innerJoin(Candidate, 't2', 't1.candidate_id = t2.candidate_id')
      .where('t1.polling_id = :pollingId', { pollingId })
      .groupBy('"t2"."candidate_id",vote')
      .orderBy('"t2"."name"', 'ASC')
      .getRawMany()      
    return result;
  }

  public async getPollingReportMemberParticipation(pollingId: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('t1')
      .select('COUNT(DISTINCT polling_order_member_id) as member_participation')
      .where('t1.polling_id = :pollingId', { pollingId })
      .andWhere('t1.completed = true')
      .andWhere('t1.polling_id = :pollingId', { pollingId })
      .getRawMany()      
    return result;
  }


}
