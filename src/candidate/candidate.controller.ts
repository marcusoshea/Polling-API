import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateCandidateDto, DeleteCandidateDto, EditCandidateDto } from './candidate.dto';
import { Candidate } from './candidate.entity';
import { CandidateService } from './candidate.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('candidate')
export class CandidateController {
  constructor(){}

  private readonly logger = new Logger(CandidateController.name)
  @Inject(CandidateService)
  private readonly service: CandidateService;

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getCandidateById(@Param('id', ParseIntPipe) id: number): Promise<Candidate> {
    return this.service.getCandidateById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/all/:id')
  public getAllCandidates(@Param('id', ParseIntPipe) id: number): Promise<Candidate[]> {
    return this.service.getAllCandidates(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createCandidate(@Body() body: CreateCandidateDto): Promise<Candidate> {
    return this.service.createCandidate(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit')
  public editCandidate(@Body() body: EditCandidateDto): Promise<boolean> {
    return this.service.editCandidate(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deleteCandidate(@Body() body: DeleteCandidateDto): Promise<boolean> {
    return this.service.deleteCandidate(body);
  }

}
