import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateDto, DeleteCandidateDto, EditCandidateDto } from './candidate.dto';
import { Candidate } from './candidate.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';
import { ExternalNotes } from '../external_notes/external_notes.entity';
import { PollingNotes } from '../polling_notes/polling_notes.entity';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service'

@Injectable()

export class CandidateService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService, public typeOrmConfigService: TypeOrmConfigService) { }
  private readonly logger = new Logger(CandidateService.name)
  @InjectRepository(Candidate)
  @InjectRepository(PollingOrder)
  @InjectRepository(ExternalNotes)
  @InjectRepository(PollingNotes)

  private readonly repository: Repository<Candidate>;

  public getCandidateById(id: number): Promise<Candidate> {
    return this.repository.findOneBy({
      candidate_id: id
    });
  }

  public async createCandidate(body: CreateCandidateDto): Promise<Candidate> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const candidate: Candidate = new Candidate();
    candidate.name = body.name;
    candidate.link = body.link;
    candidate.polling_order_id = body.polling_order_id;
    return this.repository.save(candidate);
  }

  public async editCandidate(body: EditCandidateDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      name: body.name
    }
    await this.repository.update(body.candidate_id, bodyUpdate);
    return true;
  }


  public async deleteCandidate(body: DeleteCandidateDto): Promise<boolean> {
    let candidateId = body.candidate_id;
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }

    let data = this.typeOrmConfigService.workDataSource();
    data.initialize().then(newdata =>
      newdata.createQueryBuilder()
        .delete()
        .from(ExternalNotes)
        .where('candidate_id = :candidateId', { candidateId })
        .execute()
        .then(() =>

          newdata.createQueryBuilder()
            .delete()
            .from(PollingNotes)
            .where('candidate_id = :candidateId', { candidateId })
            .execute()
            .then(() =>
              this.repository.delete(body.candidate_id)
            )
        )
    );

    return true;
  }

  public async getAllCandidates(orderId: number): Promise<Candidate[]> {
    const result = await this.repository
      .createQueryBuilder('candidate')
      .select(['candidate'])
      .where('candidate.polling_order_id = :orderId', { orderId })
      .orderBy('name')
      .getMany();
    return result;
  }

}
