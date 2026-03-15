import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoicesModule } from '../invoices/invoices.module';
import { RenewalProcessor } from './renewal.processor';
import { OverdueProcessor } from './overdue.processor';
import { CleanupProcessor } from './cleanup.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Invoice]),

    // register 3 BullMQ queues
    // one queue per job type
    BullModule.registerQueue(
      { name: 'renewal' },
      { name: 'overdue' },
      { name: 'cleanup' },
    ),

    InvoicesModule,
  ],
  providers: [
    RenewalProcessor,
    OverdueProcessor,
    CleanupProcessor,
  ],
})
export class JobsModule {}