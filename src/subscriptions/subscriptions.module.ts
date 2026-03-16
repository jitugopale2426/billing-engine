import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PlansModule } from '../plans/plans.module';
import { CustomersModule } from '../customers/customers.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    PlansModule,
    CustomersModule,
    InvoicesModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  // export
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}