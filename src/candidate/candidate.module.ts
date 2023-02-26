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
import { PollingOrder } from '../polling_order/polling_order.entity';
import { ExternalNotes } from '../external_notes/external_notes.entity';
import { PollingNotes } from '../polling_notes/polling_notes.entity';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service'
import { CandidateImages } from './candidate_images.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([Candidate]), TypeOrmModule.forFeature([PollingOrder]),
     TypeOrmModule.forFeature([ExternalNotes]), TypeOrmModule.forFeature([PollingNotes]),  TypeOrmModule.forFeature([CandidateImages]), 
    AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, JwtStrategy, TypeOrmConfigService]
})
export class CandidateModule {}
