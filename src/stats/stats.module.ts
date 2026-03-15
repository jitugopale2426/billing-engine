import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    // Stats queries Subscription and Invoice tables
    TypeOrmModule.forFeature([Subscription, Invoice]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}