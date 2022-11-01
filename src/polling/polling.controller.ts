import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AddPollingCandidateDto, CreatePollingDto, DeletePollingDto, EditPollingDto, RemovePollingCandidateDto } from './polling.dto';
import { Polling } from './polling.entity';
import { PollingService } from './polling.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PollingCandidate } from './polling_candidate.entity';

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
  @Get('/pollingsummary/:id/:orderMemberId')
  public getPollingSummary(@Param('id', ParseIntPipe) id: number, @Param('orderMemberId', ParseIntPipe) orderMemberId: number): Promise<string> {
    return this.service.getPollingSummary(id, orderMemberId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/candidates')
  public addPollingCandidates(@Body() body: AddPollingCandidateDto[]): Promise<PollingCandidate[]> {
    return this.service.addPollingCandidates(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/candidate')
  public removePollingCandidate(@Body() body: RemovePollingCandidateDto): Promise<boolean> {
    return this.service.removePollingCandidate(body);
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


  @UseGuards(JwtAuthGuard)
  @Get('/all/:id')
  public getAllPollings(@Param('id', ParseIntPipe) id: number): Promise<Polling[]> {
    return this.service.getAllPollings(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/allpn/:id')
  public getPollingNotesByCandidateId(@Param('id', ParseIntPipe) id: number): Promise<Polling[]> {
    return this.service.getPollingNotesByCandidateId(id);
  }

  
  @UseGuards(JwtAuthGuard)
  @Get('/currentpolling/:id')
  public getCurrentPolling(@Param('id', ParseIntPipe) id: number): Promise<Polling> {
    return this.service.getCurrentPolling(id);
  }
  


}
