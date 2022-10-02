import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateController } from './candidate.controller';
import { Candidate } from './candidate.entity';
import { CandidateService } from './candidate.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from '../auth/constants';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthModule } from '../auth/auth.module'
import { Order } from '../polling_order/order.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([Candidate]), TypeOrmModule.forFeature([Order]),
    AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, JwtStrategy]
})
export class CandidateModule {}
