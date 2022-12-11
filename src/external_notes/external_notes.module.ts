import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalNoteController } from './external_notes.controller';
import { ExternalNotes } from './external_notes.entity';
import { ExternalNotesService } from './external_notes.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from '../auth/constants';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthModule } from '../auth/auth.module'
import { PollingOrder } from '../polling_order/polling_order.entity';
import { Member } from 'src/member/member.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([ExternalNotes]), TypeOrmModule.forFeature([PollingOrder]), TypeOrmModule.forFeature([Member]),
    AuthModule],
  controllers: [ExternalNoteController],
  providers: [ExternalNotesService, JwtStrategy]
})
export class ExternalNotesModule {}
