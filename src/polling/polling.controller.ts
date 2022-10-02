import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreatePollingDto, DeletePollingDto, EditPollingDto } from './polling.dto';
import { Polling } from './polling.entity';
import { PollingService } from './polling.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('polling')
export class PollingController {
  constructor(){}

  private readonly logger = new Logger(PollingController.name)
  @Inject(PollingService)
  private readonly service: PollingService;

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getPollingById(@Param('id', ParseIntPipe) id: number): Promise<Polling> {
    return this.service.getPollingById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createPolling(@Body() body: CreatePollingDto): Promise<Polling> {
    return this.service.createPolling(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit')
  public editPolling(@Body() body: EditPollingDto): Promise<boolean> {
    return this.service.editPolling(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deletePolling(@Body() body: DeletePollingDto): Promise<boolean> {
    return this.service.deletePolling(body);
  }

}
