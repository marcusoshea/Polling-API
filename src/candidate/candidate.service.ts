import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateDto, DeleteCandidateDto, EditCandidateDto } from './candidate.dto';
import { Candidate } from './candidate.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';


@Injectable()

export class CandidateService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(CandidateService.name)
  @InjectRepository(Candidate)
  @InjectRepository(PollingOrder)

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
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.candidate_id);

    return true;
  }

}
