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
import { randomInt } from 'crypto';

@Injectable()

export class MemberService {
  constructor(private jwtTokenService: JwtService, public authService: AuthService) { }
  private readonly logger = new Logger(MemberService.name)
  @InjectRepository(Member)
  @InjectRepository(PollingOrder)

  private readonly repository!: Repository<Member>;

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
      .select(['member.polling_order_member_id', 'member.name', 'member.email', 'member.approved', 'member.removed', 'member.active', 'member.pom_created_at'])
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
      // Selecting the whole entity returned password (bcrypt hash) and
      // new_password_token. Callers only need the contact details.
      .select(['member.polling_order_member_id', 'member.name', 'member.email'])
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
    } as any);

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
      .catch((e: unknown) => { this.logger.warn('error', e) });

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

  public async editMember(body: EditMemberDto, memberIdToEdit: number): Promise<boolean> {
    const recordOwner = this.authService.isRecordOwner(body.authToken, memberIdToEdit);
    const orderAdmin = this.authService.isOrderAdmin(body.authToken);

    if (!recordOwner && !orderAdmin) {
      throw new UnauthorizedException();
    }

    let bodyUpdate = {}
    // The checks above authorize the member named in the route, but the row that
    // actually got written used to come from the body. Passing your own id in the path
    // and someone else's in the body therefore let any member edit any other member's
    // record — including their email, which is enough to then seize the account via a
    // password reset. The route parameter is the only id used from here on.
    const memberInfo = await this.getMemberById(memberIdToEdit)
    if (!memberInfo) {
      throw new UnauthorizedException();
    }

    // isOrderAdmin only proves the caller administers *some* order, so an admin could
    // otherwise edit members of any other order.
    if (orderAdmin && !recordOwner && memberInfo.polling_order_id !== this.authService.getPollingOrderId(body.authToken)) {
      throw new UnauthorizedException();
    }
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
    await this.repository.update(memberIdToEdit, bodyUpdate);

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
      } as any);
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
        .catch((e: unknown) => { this.logger.warn('error', e) });
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

  // How long a reset link stays usable. new_password_token_timestamp is a DATE column
  // (no time component), so a token issued late in the day gets most of a second day;
  // tightening this further means migrating that column to a timestamp.
  private static readonly RESET_TOKEN_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

  async createForgottenPasswordToken(member: Member): Promise<Member> {
    // randomInt is a CSPRNG; Math.random is predictable from a few observed outputs.
    // The column is an int4, so this uses as much of that range as it can.
    let tempToken = randomInt(100000000, 2147483647);
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
      } as any);

      let mailOptions = {
        from: '"Polling Order" <' + process.env.MAIL_FROM + '>',
        to: member.email.toLowerCase(),
        subject: 'Forgotten Password',
        text: 'Forgot Password',
        html: 'Hi! <br><br> This is a message from the Polling website. If you requested to reset your polling member password<br><br>' +
          '<a href=' + process.env.WEBSITE_URL + '/reset-password?token=' + tokenMember.new_password_token + '>Click here</a> and update your password. Otherwise please disregard this email.'  // html body
      };

      await transporter
        .sendMail(mailOptions)
        .catch((e: unknown) => { this.logger.warn('error', e) });

      return true;
    } else {
      throw new HttpException('REGISTER.USER_NOT_REGISTERED', HttpStatus.FORBIDDEN);
    }
  }

  // Returns false for a missing, unparseable or expired issue date.
  private isResetTokenCurrent(issued: Date | string | null | undefined): boolean {
    if (!issued) {
      return false;
    }
    const issuedAt = new Date(issued);
    if (Number.isNaN(issuedAt.getTime())) {
      return false;
    }
    return issuedAt.getTime() >= Date.now() - MemberService.RESET_TOKEN_MAX_AGE_MS;
  }

  async resetPassword(reqMember: any): Promise<boolean> {
    // The token is a route parameter (POST /member/verify/:token), so it lives at
    // req.params.token. Reading req.token gave undefined, and TypeORM drops undefined
    // conditions from a findOneBy where clause — the lookup therefore matched on email
    // alone, letting anyone who knew an address reset that account without a token.
    const token = Number(reqMember.params?.token);
    if (!Number.isInteger(token) || token <= 0) {
      throw new UnauthorizedException('This password reset link is invalid or has expired. Please request a new one.');
    }

    const email = reqMember.body?.email?.toLowerCase();
    const newPassword = reqMember.body?.password;
    if (!email || !newPassword) {
      throw new HttpException('Email and password are required.', HttpStatus.BAD_REQUEST);
    }

    // LOWER() to match login and token issuance: forceCreateMember stores the email
    // as typed, so an exact match would reject admin-created members with capitals.
    const memberFound = await this.repository
      .createQueryBuilder('member')
      .where('member.new_password_token = :token', { token })
      .andWhere('LOWER(member.email) = :email', { email })
      .getOne();

    // The issue date was recorded but never read, so a token stayed valid indefinitely.
    if (!memberFound || !this.isResetTokenCurrent(memberFound.new_password_token_timestamp)) {
      throw new UnauthorizedException('This password reset link is invalid or has expired. Please request a new one.');
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    // The link proves control of the inbox, so the new password applies to every
    // account on this address across all polling orders. Case-insensitive to match
    // the lookup. pom_created_at is deliberately left out: copying this account's
    // value onto the others overwrote their join dates, which decide which pollings
    // a member is counted in. Clearing the token on every row also voids any other
    // outstanding links for this address.
    await this.repository
      .createQueryBuilder()
      .update(Member)
      .set({ password: password, new_password_token: 0 })
      .where('LOWER(email) = :email', { email })
      .execute();
    return true;
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
      // Only the account that was just authenticated. Keying on email silently matched
      // nothing for admin-created members whose stored email has capitals, and would
      // otherwise reach every order using this address — knowing one account's password
      // does not prove ownership of the others, since an admin can create an approved
      // account with any email and a password of their choosing.
      await this.repository.update(goodLogin.polling_order_member_id, passwordUpdate);
      return true;
    }
    return false;
  }

}
