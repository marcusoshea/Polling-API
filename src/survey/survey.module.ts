import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { Survey } from './survey.entity';
import { SurveyResponse } from './survey_response.entity';
import { Member as PollingOrderMember } from '../member/member.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveyResponse, PollingOrderMember, PollingOrder]),
    AuthModule
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService]
})
export class SurveyModule {}
