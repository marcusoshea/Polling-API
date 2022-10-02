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
import { Order } from '../polling_order/order.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([Polling]), TypeOrmModule.forFeature([Order]),
    AuthModule],
  controllers: [PollingController],
  providers: [PollingService, JwtStrategy]
})
export class PollingModule {}
