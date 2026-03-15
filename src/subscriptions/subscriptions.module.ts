import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PlansModule } from '../plans/plans.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PlansModule,
    CustomersModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  // export
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}