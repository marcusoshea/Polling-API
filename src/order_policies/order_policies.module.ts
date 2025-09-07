import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderPolicies } from './order_policies.entity';
import { OrderPoliciesService } from './order_policies.service';
import { OrderPoliciesController } from './order_policies.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderPolicies]),
    AuthModule,
  ],
  controllers: [OrderPoliciesController],
  providers: [OrderPoliciesService],
  exports: [OrderPoliciesService],
})
export class OrderPoliciesModule {}
