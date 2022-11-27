import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingNoteController } from './polling_notes.controller';
import { PollingNotes } from './polling_notes.entity';
import { PollingNotesService } from './polling_notes.service';
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
    }), TypeOrmModule.forFeature([PollingNotes]), TypeOrmModule.forFeature([PollingOrder]), TypeOrmModule.forFeature([Member]),
    AuthModule],
  controllers: [PollingNoteController],
  providers: [PollingNotesService, JwtStrategy]
})
export class PollingNotesModule {}
