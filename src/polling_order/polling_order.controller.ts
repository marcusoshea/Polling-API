import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CreatePollingOrderDto, DeletePollingOrderDto, EditPollingOrderDto } from './polling_order.dto';
import { PollingOrder } from './polling_order.entity';
import { PollingOrderService } from './polling_order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pollingorder')
export class PollingOrderController {
  constructor() {}

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
  public createPollingOrder(@Body() body: CreatePollingOrderDto): Promise<PollingOrder> {
    return this.service.createPollingOrder(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit')
  public editPollingOrder(@Body() body: EditPollingOrderDto): Promise<boolean> {
    return this.service.editPollingOrder(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deletePollingOrder(@Body() body: DeletePollingOrderDto): Promise<boolean> {
    return this.service.deletePollingOrder(body);
  }
}
