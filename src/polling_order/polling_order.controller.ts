import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreatePollingOrderDto, DeletePollingOrderDto, EditPollingOrderDto } from './polling_order.dto';
import { PollingOrder } from './polling_order.entity';
import { PollingOrderService } from './polling_order.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('pollingorder')
export class PollingOrderController {
  constructor(){}

  private readonly logger = new Logger(PollingOrderController.name)
  @Inject(PollingOrderService)
  private readonly service: PollingOrderService;

  @Get()
  public getPollingOrders(): Promise<PollingOrder[]> {
    return this.service.getPollingOrders();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getPollingOrderById(@Param('id', ParseIntPipe) id: number): Promise<PollingOrder> {
    return this.service.getPollingOrderById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createPolling(@Body() body: CreatePollingOrderDto): Promise<PollingOrder> {
    return this.service.createPollingOrder(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit')
  public editPolling(@Body() body: EditPollingOrderDto): Promise<boolean> {
    return this.service.editPollingOrder(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deletePolling(@Body() body: DeletePollingOrderDto): Promise<boolean> {
    return this.service.deletePollingOrder(body);
  }

}
