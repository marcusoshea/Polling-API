import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UploadedFile, UseGuards, UseInterceptors, Version } from '@nestjs/common';
import { CreateCandidateDto, DeleteCandidateDto, EditCandidateDto, CreateCandidateImageDto, DeleteCandidateImageDto } from './candidate.dto';
import { Candidate } from './candidate.entity';
import { CandidateService } from './candidate.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Headers } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { CandidateImages } from './candidate_images.entity';

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
  
  // @UseGuards(JwtAuthGuard)
  // @Post('/createImage/:candidate_id')
  // @UseInterceptors(FileInterceptor('file'))
  // public createCandidateImage(@Headers() headers, @Param('candidate_id', ParseIntPipe) candidate_id: number, @UploadedFile() body: CreateCandidateImageDto) {
  //   return this.service.createCandidateImage(headers, candidate_id, body);
  // }

  @UseGuards(JwtAuthGuard)
  @Post('/createImage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  public createCandidateImage(@Body() data: any, @UploadedFile() file: Express.Multer.File) {
      //console.log({ data, file })
      return this.service.createCandidateImage(file, data);
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

  @UseGuards(JwtAuthGuard)
  @Delete('/deleteImage')
  public deleteCandidateImage(@Body() body: DeleteCandidateImageDto): Promise<boolean> {
    return this.service.deleteCandidateImage(body);
  }

  @Get('/candidateImages/:id')
  public getAllCandidateImages(@Param('id', ParseIntPipe) id: number): Promise<CandidateImages> {
    return this.service.getAllCandidateImages(id);
  }

}
