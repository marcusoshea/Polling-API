import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { MemberModule } from './member/member.module';
import { PollingModule } from './polling/polling.module';
import { CandidateModule } from './candidate/candidate.module';
import { PollingOrderModule } from './polling_order/polling_order.module';
import { PollingNotesModule } from './polling_notes/polling_notes.module';
import { ExternalNotesModule } from './external_notes/external_notes.module';
import { FeedbackModule } from './feedback/feedback.module';
import { SurveyModule } from './survey/survey.module';

const envFilePath: string = getEnvPath(`${process.cwd()}/src/common/envs`);

@Module({
  imports: [PollingNotesModule, PollingOrderModule, CandidateModule, PollingModule, ExternalNotesModule, MemberModule, FeedbackModule, SurveyModule,
    ConfigModule.forRoot({ 
      envFilePath, isGlobal: true 
    }), TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService })],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
