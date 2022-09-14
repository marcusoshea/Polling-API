import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from './member.controller';
import { Member } from './member.entity';
import { MemberService } from './member.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from '../../auth/constants';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { AuthModule } from '../../auth/auth.module'

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([Member]),
    AuthModule],
  controllers: [MemberController],
  providers: [MemberService, JwtStrategy]
})
export class MemberModule {}
