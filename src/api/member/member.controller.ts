import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { CreateMemberDto } from './member.dto';
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
  @Post('/create-member/new')
  public createMember(@Body() body: CreateMemberDto): Promise<Member> {
    return this.service.createMember(body);
  }

  @Post('login')
  async login(@Request() req) {
    return this.service.loginWithCredentials(req);
  }
}
