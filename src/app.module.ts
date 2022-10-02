import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { MemberModule } from './member/member.module';
import { PollingModule } from './polling/polling.module';

const envFilePath: string = getEnvPath(`${__dirname}/common/envs`);

@Module({
  imports: [PollingModule, MemberModule, ConfigModule.forRoot({ envFilePath, isGlobal: true }), TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService })],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
