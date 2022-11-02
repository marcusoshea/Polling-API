import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollingNoteDto, DeletePollingNoteDto, EditPollingNoteDto } from './polling_notes.dto';
import { PollingNotes } from './polling_notes.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';

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
    let finished=0;
    body.forEach(x => {
      const pollingNote: PollingNotes = new PollingNotes();
      pollingNote.polling_notes_id = x.polling_notes_id;
      if (x.note.length > 0) {
        pollingNote.note = x.note;
      }
      pollingNote.vote = x.vote;
      pollingNote.polling_id = x.polling_id;
      pollingNote.candidate_id = x.candidate_id;
      pollingNote.polling_order_id = x.polling_order_id;
      pollingNote.pn_created_at = new Date(x.pn_created_at);
      pollingNote.polling_order_member_id = memberID;
      pollingNote.completed = x.completed;
      this.repository.save(pollingNote);
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

}
