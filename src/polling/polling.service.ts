import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollingDto, DeletePollingDto, EditPollingDto } from './polling.dto';
import { Polling } from './polling.entity';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';


@Injectable()

export class PollingService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(PollingService.name)
  @InjectRepository(Polling)
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

}
