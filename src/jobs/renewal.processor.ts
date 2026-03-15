import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import type { Queue, Job } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { BillingCycle } from '../plans/entities/plan.entity';

@Processor('renewal')
export class RenewalProcessor {
  private readonly logger = new Logger(RenewalProcessor.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectQueue('renewal')
    private readonly renewalQueue: Queue,
    private readonly invoicesService: InvoicesService,
  ) {}

  // Step 1 — @Cron runs daily
  // finds subscriptions due today
  // enqueues each one into BullMQ
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyRenewal() {
    this.logger.log('Scheduling daily renewal jobs...');

    const today = new Date();

    // find all active subscriptions due for renewal
    const subscriptions = await this.subRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        next_renewal_date: LessThanOrEqual(today),
      },
      relations: ['plan', 'customer'],
    });

    this.logger.log(
      `Found ${subscriptions.length} subscriptions due for renewal`,
    );

    // enqueue each subscription as separate job
    for (const sub of subscriptions) {
      await this.renewalQueue.add(
        'process-renewal',
        { subscriptionId: sub.id },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s
          },
        },
      );
    }
  }

  // Step 2 — BullMQ Processor does actual work
  @Process('process-renewal')
  async processRenewal(job: Job<{ subscriptionId: string }>) {
    const { subscriptionId } = job.data;
    this.logger.log(`Processing renewal for subscription: ${subscriptionId}`);

    const subscription = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'customer'],
    });

    if (!subscription) {
      this.logger.warn(`Subscription ${subscriptionId} not found`);
      return;
    }

    // simulate mock payment
    const SUCCESS_RATE = parseFloat(
      process.env.PAYMENT_SUCCESS_RATE as string,
    ) || 0.8;
    const paymentSuccess = Math.random() < SUCCESS_RATE;

    this.logger.log(
      `Payment ${paymentSuccess ? 'succeeded' : 'failed'} for ${subscriptionId}`,
    );

    if (paymentSuccess) {
      // generate invoice
      await this.invoicesService.generateInvoice(subscription);

      // advance subscription period
      const now = new Date();
      const newPeriodEnd = new Date(now);

      if (subscription.plan.billing_cycle === BillingCycle.MONTHLY) {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      } else {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      }

      subscription.current_period_start = now;
      subscription.current_period_end = newPeriodEnd;
      subscription.next_renewal_date = newPeriodEnd;
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.subRepo.save(subscription);

      this.logger.log(
        `Renewal successful for ${subscriptionId}`,
      );
    } else {
      // payment failed → mark as past_due
      subscription.status = SubscriptionStatus.PAST_DUE;
      subscription.past_due_since = new Date();
      await this.subRepo.save(subscription);

      this.logger.warn(
        `Payment failed — subscription ${subscriptionId} marked past_due`,
      );
    }
  }
}