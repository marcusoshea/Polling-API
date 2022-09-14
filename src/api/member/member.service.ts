import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMemberDto } from './member.dto';
import { Member } from './member.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()

export class MemberService {
  constructor(private jwtTokenService: JwtService) { }
  private readonly logger = new Logger(MemberService.name)
  @InjectRepository(Member)
  private readonly repository: Repository<Member>;

  public getMemberById(id: number): Promise<Member> {
    return this.repository.findOneBy({
      polling_order_member_id: id
    });
  }

  public getMember(memberEmail: string, order_id: number): Promise<Member> {
    return this.repository.findOneBy({
      email: memberEmail,
      polling_order_id: order_id
    });
  }

  public async createMember(body: CreateMemberDto): Promise<Member> {
    const member: Member = new Member();
    // this.logger.warn('Accessed', JSON.stringify(body));
    member.name = body.name;
    member.email = body.email;
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(body.password, salt);
    member.polling_order_id = body.polling_order_id;
    return this.repository.save(member);
  }

  async checkMemberCredentials(memberEmail: string, password: string, polling_order_id: number): Promise<any> {
    const member = await this.getMember(memberEmail, polling_order_id);
    const validPassword = await bcrypt.compare(password, member.password);
    if (member) {
        if (validPassword) {
            const { password, ...result } = member
            return result
        }
        return false
    }
}

async loginWithCredentials(member: any) {
    const goodLogin = await this.checkMemberCredentials(member.body.email, member.body.password, member.body.polling_order_id);
    const payload = { email: goodLogin.email, sub: goodLogin.polling_order_id };
    if (!goodLogin) {
        throw new UnauthorizedException();
    }
    return {
        access_token: this.jwtTokenService.sign(payload),
    };
}


}
