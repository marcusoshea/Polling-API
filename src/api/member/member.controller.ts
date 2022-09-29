import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateMemberDto, DeleteMemberDto, EditMemberDto } from './member.dto';
import { Member } from './member.entity';
import { MemberService } from './member.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Injectable()

@Controller('member')
export class MemberController {
  constructor(){}

  private readonly logger = new Logger(MemberController.name)
  @Inject(MemberService)
  private readonly service: MemberService;

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  public getMemberById(@Param('id', ParseIntPipe) id: number): Promise<Member> {
    return this.service.getMemberById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  public createMember(@Body() body: CreateMemberDto): Promise<Member> {
    return this.service.createMember(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  public deleteMember(@Body() body: DeleteMemberDto): Promise<boolean> {
    return this.service.deleteMember(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/edit/:id')
  public editMember(@Body() body: EditMemberDto, @Param('id', ParseIntPipe) id: number,): Promise<boolean> {
    return this.service.editMember(body, id);
  }

  @Post('login')
  async login(@Request() req) {
    return this.service.loginWithCredentials(req);
  }

  @Post('forgot-password')
  async sendEmailForgotPassword(@Request() req) {
    return this.service.sendEmailForgotPassword(req);
  }
}
