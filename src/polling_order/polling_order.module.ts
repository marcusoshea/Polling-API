import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingOrderController } from './polling_order.controller';
import { PollingOrder } from './polling_order.entity';
import { PollingOrderService } from './polling_order.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from '../auth/constants';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '30d'}
    }), TypeOrmModule.forFeature([PollingOrder]), TypeOrmModule.forFeature([PollingOrder]),
    AuthModule],
  controllers: [PollingOrderController],
  providers: [PollingOrderService, JwtStrategy]
})
export class PollingOrderModule {}
