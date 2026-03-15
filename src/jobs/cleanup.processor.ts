import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import type { Queue, Job } from 'bull';
import { Cron } from '@nestjs/schedule';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';

@Processor('cleanup')
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectQueue('cleanup')
    private readonly cleanupQueue: Queue,
  ) {}

  // Step 1 — @Cron runs every day at 1am
  // finds past_due subscriptions beyond grace period
  // enqueues each into BullMQ
  @Cron('0 1 * * *')
  async scheduleCleanup() {
    this.logger.log('Scheduling subscription cleanup...');

    const GRACE_PERIOD_DAYS =
      parseInt(process.env.GRACE_PERIOD_DAYS as string) || 7;

    // calculate grace period threshold
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - GRACE_PERIOD_DAYS);

    // find past_due subscriptions beyond grace period
    const expiredSubs = await this.subRepo.find({
      where: {
        status: SubscriptionStatus.PAST_DUE,
        past_due_since: LessThan(threshold),
      },
    });

    this.logger.log(
      `Found ${expiredSubs.length} subscriptions to cancel`,
    );

    // enqueue each subscription as separate job
    for (const sub of expiredSubs) {
      await this.cleanupQueue.add(
        'process-cleanup',
        { subscriptionId: sub.id },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        },
      );
    }
  }

  // Step 2 — BullMQ Processor does actual work
  @Process('process-cleanup')
  async processCleanup(job: Job<{ subscriptionId: string }>) {
    const { subscriptionId } = job.data;
    this.logger.log(
      `Cancelling subscription: ${subscriptionId}`,
    );

    const subscription = await this.subRepo.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${subscriptionId} not found`,
      );
      return;
    }

    // cancel subscription
    subscription.status = SubscriptionStatus.CANCELLED;
    await this.subRepo.save(subscription);

    // log summary as document requires
    this.logger.log(
      `Subscription ${subscriptionId} cancelled — was past_due since ${subscription.past_due_since}`,
    );
  }
}