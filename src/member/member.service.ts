import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, createQueryBuilder, Like, Repository } from 'typeorm';
import { CreateMemberDto, DeleteMemberDto, EditMemberDto, ForceCreateMemberDto } from './member.dto';
import { Member } from './member.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from 'src/auth/auth.service';
import * as nodemailer from 'nodemailer';

@Injectable()

export class MemberService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(MemberService.name)
  @InjectRepository(Member)
  @InjectRepository(PollingOrder)

  private readonly repository: Repository<Member>;

  public async getMemberById(id: number): Promise<Member> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select('member')
      .leftJoinAndMapOne('member.pollingOrderInfo', PollingOrder, 'order', 'order.polling_order_id=member.polling_order_id')
      .where('member.polling_order_member_id = :id', { id })
      .getOne();
    return result;
  }

  public async getAllMembers(orderId: number): Promise<Member[]> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select(['member.polling_order_member_id', 'member.name', 'member.email', 'member.approved', 'member.removed', 'member.active'])
      .where('member.polling_order_id = :orderId', { orderId })
      .getMany();
    return result;
  }

  public async getMember(memberEmail: string, orderID: number): Promise<Member> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select(['member.polling_order_member_id', 'member.name', 'member.email', 'member.approved','member.active'])
      .leftJoinAndMapOne('member.pollingOrderInfo', PollingOrder, 'order', 'order.polling_order_id=member.polling_order_id')
      .where('LOWER(member.email) = :memberEmail', { memberEmail })
      .andWhere('member.polling_order_id = :orderID', { orderID })
      .getOne();
    return result;
  }

  public async getMemberAuth(memberEmail: string, orderID: number): Promise<Member> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select('member')
      .leftJoinAndMapOne('member.pollingOrderInfo', PollingOrder, 'order', 'order.polling_order_id=member.polling_order_id')
      .where('LOWER(member.email) = :memberEmail', { memberEmail })
      .andWhere('member.polling_order_id = :orderID', { orderID })
      .getOne();
    return result;
  }
  public async getOrderClerk(orderID: number): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('member')
      .select('member')
      .innerJoinAndMapOne('member.pollingOrderInfo', PollingOrder, 'order', 'order.polling_order_admin=member.polling_order_member_id')
      .where('member.polling_order_id = :orderID', { orderID })
      .getOne();
    return result;
  }

  public async forceCreateMember(body: ForceCreateMemberDto): Promise<Member> {
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
    member.approved = true;
    return this.repository.save(member);
  }

  public async createMember(body: CreateMemberDto): Promise<Member> {
    const orderClerk = await this.getOrderClerk(body.polling_order_id);
    if ((await this.getMember(body.email.toLowerCase(), body.polling_order_id))?.email) {
      throw new HttpException('Account exists already.', HttpStatus.NOT_ACCEPTABLE);         
    }
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    });

    let mailOptions = {
      from: '"Polling Order" <' + process.env.MAIL_FROM + '>',
      to: orderClerk.email,
      subject: 'New ' + orderClerk.pollingOrderInfo.polling_order_name + ' Polling Member Registered',
      text: 'New Polling ' + orderClerk.pollingOrderInfo.polling_order_name + ' Member Registered',
      html: 'Hi! <br><br> A New Polling ' + orderClerk.pollingOrderInfo.polling_order_name + ' Order Member has Registered<br><br>' +
        '<a href=' + process.env.WEBSITE_URL + '>Click here</a>'
    };

    await transporter
      .sendMail(mailOptions)
      .then(this.logger.warn('MAIL_PORT', process.env.MAIL_PORT))
      .catch(e => { this.logger.warn('error', e) });

    const member: Member = new Member();
    member.name = body.name;
    member.email = body.email.toLowerCase();
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
    const recordOwner = this.authService.isRecordOwner(body.authToken, isRecordOwner);
    const orderAdmin = this.authService.isOrderAdmin(body.authToken);

    if (!recordOwner && !orderAdmin) {
      throw new UnauthorizedException();
    }

    let bodyUpdate = {}
    const memberInfo = await this.getMemberById(body.polling_order_member_id)
    const year = memberInfo.pom_created_at.getFullYear();
    const month = parseInt(memberInfo.pom_created_at.getMonth().toString().padStart(3, "0")) + 1;
    const day = parseInt(memberInfo.pom_created_at.getDate().toString().padStart(3, "0")) + 1;
    //const created = year + '-' + month + '-' + day;

    const created = memberInfo.pom_created_at.toISOString().split('T')[0];

    if (recordOwner) {
      bodyUpdate = {
        email: body.email.toLowerCase(),
        name: body.name,
        pom_created_at: created,
        approved: memberInfo.approved,
        removed: memberInfo.removed,
        active: body.active
      }
    } else {
      bodyUpdate = {
        email: body.email.toLowerCase(),
        name: body.name,
        pom_created_at: created,
        approved: body.approved,
        removed: body.removed,
        active: body.active
      }
    }
    await this.repository.update(body.polling_order_member_id, bodyUpdate);

    //new account approved by order clerk
    if (orderAdmin && !recordOwner && !body.removed) {
      const orderClerk = await this.getOrderClerk(body.polling_order_id);
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD
        }
      });
      let mailOptions = {
        from: '"Polling Order" <' + process.env.MAIL_FROM + '>',
        to: body.email.toLowerCase(),
        subject: orderClerk.pollingOrderInfo.polling_order_name + ' Registration complete',
        text: orderClerk.pollingOrderInfo.polling_order_name + ' Registration complete',
        html: 'Hi! <br><br>Your registration has been approved for the polling website<br><br>' +
          '<a href=' + process.env.WEBSITE_URL + '>Click here</a> to visit the site'
      };

      await transporter
        .sendMail(mailOptions)
        .then(this.logger.warn('MAIL_PORT', process.env.MAIL_PORT))
        .catch(e => { this.logger.warn('error', e) });
    }
    return true;
  }

  async checkMemberCredentials(memberEmail: string, password: string, polling_order_id: number): Promise<any> {
    const member = await this.getMemberAuth(memberEmail.toLowerCase(), polling_order_id);
    if (member) {
      const validPassword = await bcrypt.compare(password, member.password);
      if (validPassword && member.approved && !member.removed) {
        const { password, ...result } = member
        return result
      }
      return false
    }
  }

  async loginWithCredentials(member: any) {
    const goodLogin = await this.checkMemberCredentials(member.body.email.toLowerCase(), member.body.password, member.body.polling_order_id);
    if (!goodLogin) {
      throw new UnauthorizedException();
    }
    const accessToken = await this.jwtTokenService.sign(goodLogin);
    const isOrderAdmin = await this.authService.isOrderAdmin(accessToken)
    return {
      access_token: accessToken, isOrderAdmin: isOrderAdmin, pollingOrder: member.body.polling_order_id,
      memberId: goodLogin.polling_order_member_id, name: goodLogin.name, email: goodLogin.email.toLowerCase(), active: goodLogin.active
    };
  }

  async createForgottenPasswordToken(member: Member): Promise<Member> {
    let tempToken = (Math.floor(Math.random() * (9000000)) + 1000000);
    let tempDate = new Date();

    const tokenUpdate = {
      email: member.email.toLowerCase(),
      new_password_token: tempToken,
      new_password_token_timestamp: tempDate
    }
    member.new_password_token = tempToken;
    member.new_password_token_timestamp = tempDate;
    await this.repository.update(member.polling_order_member_id, tokenUpdate);
    return member;

  }

  async sendEmailForgotPassword(reqMember: any): Promise<boolean> {
    const member = await this.getMember(reqMember.body.email.toLowerCase(), reqMember.body.polling_order_id);
    if (!member) throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);

    const tokenMember = await this.createForgottenPasswordToken(member);

    if (tokenMember && tokenMember.new_password_token) {
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD
        }
      });

      let mailOptions = {
        from: '"Polling Order" <' + process.env.MAIL_FROM + '>',
        to: member.email.toLowerCase(),
        subject: 'Forgotten Password',
        text: 'Forgot Password',
        html: 'Hi! <br><br> This is a message from the Polling website. If you requested to reset your polling member password<br><br>' +
          '<a href=' + process.env.WEBSITE_URL + '/reset-password?token=' + tokenMember.new_password_token + '>Click here</a> and update your password. Otherwise please disregard this email.'  // html body
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

  async resetPassword(reqMember: any): Promise<boolean> {
    const memberFound = await this.repository.findOneBy({
      new_password_token: reqMember.token,
      email: reqMember.body.email.toLowerCase()
    });

    if (memberFound) {

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(reqMember.body.password, salt);

      const passwordUpdate = {
        password: password,
        pom_created_at: memberFound.pom_created_at,
        new_password_token: 0
      }
      await this.repository.update({ email: memberFound.email.toLowerCase() }, passwordUpdate);
      return true;
    }
    return false;
  }


  async changePassword(reqMember: any): Promise<boolean> {
    const goodLogin = await this.checkMemberCredentials(reqMember.body.email.toLowerCase(), reqMember.body.password, reqMember.body.pollingOrderId);
    if (!goodLogin) {
      throw new UnauthorizedException();
    }

    if (goodLogin) {

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(reqMember.body.newPassword, salt);

      const passwordUpdate = {
        password: password,
        pom_created_at: goodLogin.pom_created_at,
        new_password_token: 0
      }
      await this.repository.update({ email: goodLogin.email.toLowerCase() }, passwordUpdate);
      return true;
    }
    return false;
  }

}
