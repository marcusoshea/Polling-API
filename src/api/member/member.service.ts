import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, createQueryBuilder, Like, Repository } from 'typeorm';
import { CreateMemberDto } from './member.dto';
import { Member } from './member.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Order } from '../polling_order/order.entity';
import { AuthService } from 'src/auth/auth.service';
import { json } from 'stream/consumers';

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
      return this.repository.save(member);
    
  }

  async checkMemberCredentials(memberEmail: string, password: string, polling_order_id: number): Promise<any> {
    const member = await this.getMember(memberEmail, polling_order_id);
    this.logger.warn('Accessed', JSON.stringify(member));
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

}
