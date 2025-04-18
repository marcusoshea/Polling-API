import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreatePollingNoteDto, EditPollingNoteDto, DeletePollingNoteDto, GetAllPollingNoteDto } from './polling_notes.dto';
import { PollingNotes } from './polling_notes.entity';
import { PollingNotesService } from './polling_notes.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('pollingnote')
export class PollingNoteController {
  constructor(){}

  private readonly logger = new Logger(PollingNoteController.name)
  @Inject(PollingNotesService)
  private readonly service: PollingNotesService;

  @UseGuards(JwtAuthGuard)
  @Get('/totals/:id')
  public getPollingReportTotals(@Param('id', ParseIntPipe) id: number): Promise<PollingNotes> {
    return this.service.getPollingReportTotals(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getPollingNoteById(@Param('id', ParseIntPipe) id: number): Promise<PollingNotes> {
    return this.service.getPollingNoteById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/all')
  public getAllPollingNotesById(@Body() body: GetAllPollingNoteDto): Promise<any[]> {
    return this.service.getAllPollingNotesById(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createPollingNote(@Body() body: CreatePollingNoteDto[]): Promise<boolean> {
    return this.service.createPollingNote(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit/:id')
  public editPollingNote(@Body() body: EditPollingNoteDto, @Param('id', ParseIntPipe) id: number,): Promise<boolean> {
    return this.service.editPollingNote(body, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deletePollingNote(@Body() body: DeletePollingNoteDto): Promise<boolean> {
    return this.service.deletePollingNote(body);
  }

}
