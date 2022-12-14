import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { CreateMemberDto, DeleteMemberDto, EditMemberDto, ForceCreateMemberDto } from './member.dto';
import { Member } from './member.entity';
import { MemberService } from './member.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Injectable()

@Controller('member')
export class MemberController {
  constructor(){}

  private readonly logger = new Logger(MemberController.name)
  @Inject(MemberService)
  private readonly service: MemberService;

  @UseGuards(JwtAuthGuard)
  @Get('/all/:id')
  public getAllMembers(@Param('id', ParseIntPipe) id: number): Promise<Member[]> {
    return this.service.getAllMembers(id);
  }

  @Get('/orderclerk/:id')
  public getOrderClerk(@Param('id', ParseIntPipe) id: number): Promise<Member> {
    return this.service.getOrderClerk(id);
  }

  @Post('/create')
  public createMember(@Body() body: CreateMemberDto): Promise<Member> {
    return this.service.createMember(body);
  }

  @Post('/forcecreate')
  public forceCreateMember(@Body() body: ForceCreateMemberDto): Promise<Member> {
    return this.service.forceCreateMember(body);
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

  @Post('passwordToken')
  async sendEmailToken(@Request() req) {
    return this.service.sendEmailForgotPassword(req);
  }

  @Post('verify/:token')
  public async resetPassword(@Request() params): Promise<boolean> {
      return await this.service.resetPassword(params);
  }

  @Put('changePassword')
  public async changePassword(@Request() params): Promise<boolean> {
      return await this.service.changePassword(params);
  }

}
