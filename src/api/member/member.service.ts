import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, createQueryBuilder, Like, Repository } from 'typeorm';
import { CreateMemberDto, DeleteMemberDto, EditMemberDto } from './member.dto';
import { Member } from './member.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Order } from '../polling_order/order.entity';
import { AuthService } from 'src/auth/auth.service';
import { json } from 'stream/consumers';
import * as nodemailer from 'nodemailer';


@Injectable()

export class MemberService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(MemberService.name)
  @InjectRepository(Member)
  @InjectRepository(Order)

  private readonly repository: Repository<Member>;

  public getMemberById(id: number): Promise<Member> {
    return this.repository.findOneBy({
      polling_order_member_id: id
    });
  }

  public async getMember(memberEmail: string, orderID: number): Promise<Member> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select('member')
      .leftJoinAndMapOne('member.pollingOrderInfo', Order, 'order', 'order.polling_order_id=member.polling_order_id')
      .where('member.email = :memberEmail', { memberEmail })
      .andWhere('member.polling_order_id = :orderID', { orderID })
      .getOne();
    return result;
  }

  public async createMember(body: CreateMemberDto): Promise<Member> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    const member: Member = new Member();
    member.name = body.name;
    member.email = body.email;
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(body.password, salt);
    member.polling_order_id = body.polling_order_id;
    member.pom_created_at = new Date(body.pom_created_at);
    return this.repository.save(member);
  }

  public async deleteMember(body: DeleteMemberDto): Promise<boolean> {
    if (!this.authService.isOrderAdmin(body.authToken)) {
      throw new UnauthorizedException();
    }
    await this.repository.delete(body.polling_order_member_id);

    return true;
  }


  public async editMember(body: EditMemberDto, isRecordOwner: number): Promise<boolean> {
    if (!this.authService.isRecordOwner(body.authToken, isRecordOwner)) {
      throw new UnauthorizedException();
    }
    const bodyUpdate = {
      email: body.email,
      name: body.name,
      pom_created_at: body.pom_created_at
    }
    await this.repository.update(body.polling_order_member_id, bodyUpdate);
    return true;
  }

  async checkMemberCredentials(memberEmail: string, password: string, polling_order_id: number): Promise<any> {
    const member = await this.getMember(memberEmail, polling_order_id);
    if (member) {
      const validPassword = await bcrypt.compare(password, member.password);
      if (validPassword) {
        const { password, ...result } = member
        return result
      }
      return false
    }
  }

  async loginWithCredentials(member: any) {
    const goodLogin = await this.checkMemberCredentials(member.body.email, member.body.password, member.body.polling_order_id);
    if (!goodLogin) {
      throw new UnauthorizedException();
    }
    return {
      access_token: this.jwtTokenService.sign(goodLogin),
    };
  }

  async createForgottenPasswordToken(member: Member): Promise<Member> {


      let tempToken = (Math.floor(Math.random() * (9000000)) + 1000000);
      let tempDate = new Date();

      const tokenUpdate = {
        email: member.email,
        new_password_token: tempToken,
        new_password_token_timestamp: tempDate
      }
      member.new_password_token = tempToken;
      member.new_password_token_timestamp = tempDate;
      await this.repository.update(member.polling_order_member_id, tokenUpdate);
      return member;
    
  }



  async sendEmailForgotPassword(reqMember: any): Promise<boolean> {

    const member = await this.getMember(reqMember.body.email, reqMember.body.polling_order_id);
    if (!member) throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const tokenMember = await this.createForgottenPasswordToken(member);
    this.logger.warn('MAIL_HOST', process.env.MAIL_HOST);
    this.logger.warn('MAIL_PORT', process.env.MAIL_PORT);
    this.logger.warn('MAIL_SECURE', process.env.MAIL_SECURE);
    this.logger.warn('MAIL_USERNAME', process.env.MAIL_USERNAME);
    this.logger.warn('MAIL_PASSWORD', process.env.MAIL_PASSWORD);
    this.logger.warn('MAIL_PORT', process.env.MAIL_PORT);

    if (tokenMember && tokenMember.new_password_token) {
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass:   process.env.MAIL_PASSWORD
        }
      });

      let mailOptions = {
        from: '"Polling Order" <' + process.env.MAIL_FROM + '>',
        to: member.email,
        subject: 'Frogotten Password',
        text: 'Forgot Password',
        html: 'Hi! <br><br> If you requested to reset your password<br><br>' +
          '<a href=' + process.env.BASE_URL + ':' + process.env.PORT + '/member/reset-password/' + tokenMember.new_password_token + '>Click here</a>'  // html body
      };

      const result = await transporter
      .sendMail(mailOptions)
      .then(this.logger.warn('MAIL_PORT', process.env.MAIL_PORT))
      .catch(e => { this.logger.warn('error', e) });

      return result;
    } else {
      throw new HttpException('REGISTER.USER_NOT_REGISTERED', HttpStatus.FORBIDDEN);
    }
  }



}
