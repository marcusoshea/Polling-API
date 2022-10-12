import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePollingOrderDto, DeletePollingOrderDto, EditPollingOrderDto } from './polling_order.dto';
import { PollingOrder } from './polling_order.entity';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';


@Injectable()

export class PollingOrderService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(PollingOrderService.name)
  @InjectRepository(PollingOrder)

  private readonly repository: Repository<PollingOrder>;


  public getPollingOrders(): Promise<PollingOrder[]> {
    return this.repository.find();
  }

  public getPollingOrderById(id: number): Promise<PollingOrder> {
    return this.repository.findOneBy({
      polling_order_id: id
    });
  }

  public async createPollingOrder(body: CreatePollingOrderDto): Promise<PollingOrder> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const polling: PollingOrder = new PollingOrder();
    polling.polling_order_name = body.polling_order_name;
    polling.polling_order_admin = body.polling_order_admin;
    polling.polling_order_admin_assistant = body.polling_order_admin_assistant;
    return this.repository.save(polling);
  }

  public async editPollingOrder(body: EditPollingOrderDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      polling_order_name: body.polling_order_name,
      polling_order_admin: body.polling_order_admin,
      polling_order_admin_assistant: body.polling_order_admin_assistant
    }
    await this.repository.update(body.polling_order_id, bodyUpdate);
    return true;
  }


  public async deletePollingOrder(body: DeletePollingOrderDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.polling_order_id);

    return true;
  }

}
