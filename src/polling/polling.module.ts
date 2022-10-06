import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingController } from './polling.controller';
import { Polling } from './polling.entity';
import { PollingService } from './polling.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from '../auth/constants';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthModule } from '../auth/auth.module'
import { PollingOrder } from '../polling_order/polling_order.entity';
import { PollingNotes } from 'src/polling_notes/polling_notes.entity';
import { Candidate } from 'src/candidate/candidate.entity';
import { Member } from 'src/member/member.entity';
import { PollingCandidate } from './polling_candidate.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([Polling]), TypeOrmModule.forFeature([PollingOrder]), TypeOrmModule.forFeature([PollingNotes]), 
    TypeOrmModule.forFeature([Candidate]),TypeOrmModule.forFeature([Member]),TypeOrmModule.forFeature([PollingCandidate]),
    AuthModule],
  controllers: [PollingController],
  providers: [PollingService, JwtStrategy]
})
export class PollingModule {}
