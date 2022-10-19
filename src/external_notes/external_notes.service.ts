import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExternalNoteDto, EditExternalNoteDto, DeleteExternalNoteDto } from './external_notes.dto';
import { ExternalNotes } from './external_notes.entity';
import { Member } from '../member/member.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

@Injectable()

export class ExternalNotesService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(ExternalNotesService.name)
  @InjectRepository(ExternalNotes)

  private readonly repository: Repository<ExternalNotes>;

  public getExternalNoteById(id: number): Promise<ExternalNotes> {
    return this.repository.findOneBy({
      external_notes_id: id
    });
  }

  public async getExternalNoteByCandidateId(id: number): Promise<ExternalNotes[]> {
    const result = await this.repository
    .createQueryBuilder('externalnotes')
    .select('externalnotes','member')
    .innerJoinAndMapOne('externalnotes.polling_order_member_id', Member, 'member', 'member.polling_order_member_id=externalnotes.polling_order_member_id')
    .where('externalnotes.candidate_id = :id', { id })
    .orderBy('externalnotes.en_created_at')
    .getMany()
    ;
    return result;


  }

  public async createExternalNote(body: CreateExternalNoteDto): Promise<ExternalNotes> {
    const memberID = this.authService.getPollingOrderMemberId(body.authToken);
    const externalNote: ExternalNotes = new ExternalNotes();
    externalNote.external_note = body.external_note;
    externalNote.candidate_id = body.candidate_id;
    externalNote.polling_order_member_id = memberID;
    externalNote.en_created_at = new Date(body.en_created_at);
    return this.repository.save(externalNote);
  }

  

  public async editExternalNote(body: EditExternalNoteDto, isRecordOwner: number): Promise<boolean> {
    if (!this.authService.isRecordOwner(body.authToken, isRecordOwner)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      note : body.external_note,
      candidate_id : body.candidate_id,
      polling_order_member_id : body.polling_order_member_id
    }
    await this.repository.update(body.external_notes_id, bodyUpdate);
    return true;
  }

  public async deleteExternalNote(body: DeleteExternalNoteDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken) && !this.authService.isRecordOwner(body.authToken, body.polling_order_member_id)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.external_notes_id);

    return true;
  }

}
