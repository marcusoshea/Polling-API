import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateExternalNoteDto, EditExternalNoteDto, DeleteExternalNoteDto } from './external_notes.dto';
import { ExternalNotes } from './external_notes.entity';
import { ExternalNotesService } from './external_notes.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('externalnote')
export class ExternalNoteController {
  constructor(){}

  private readonly logger = new Logger(ExternalNoteController.name)
  @Inject(ExternalNotesService)
  private readonly service: ExternalNotesService;

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getExternalNoteById(@Param('id', ParseIntPipe) id: number): Promise<ExternalNotes> {
    return this.service.getExternalNoteById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/candidate/:id')
  public getExternalNoteByCandidateId(@Param('id', ParseIntPipe) id: number): Promise<ExternalNotes[]> {
    return this.service.getExternalNoteByCandidateId(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createExternalNote(@Body() body: CreateExternalNoteDto): Promise<ExternalNotes> {
    return this.service.createExternalNote(body);
  }

  
  @UseGuards(JwtAuthGuard)
  @Put('/edit/:id')
  public editPollingNote(@Body() body: EditExternalNoteDto, @Param('id', ParseIntPipe) id: number,): Promise<boolean> {
    return this.service.editExternalNote(body, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deleteExternalNote(@Body() body: DeleteExternalNoteDto): Promise<boolean> {
    return this.service.deleteExternalNote(body);
  }

}
