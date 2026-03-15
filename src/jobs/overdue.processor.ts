import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import type { Queue, Job } from 'bull';
import { Cron } from '@nestjs/schedule';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';

@Processor('overdue')
export class OverdueProcessor {
  private readonly logger = new Logger(OverdueProcessor.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectQueue('overdue')
    private readonly overdueQueue: Queue,
  ) {}

  // Step 1 — @Cron runs every 6 hours
  // finds issued invoices past due date
  // enqueues each into BullMQ
  @Cron('0 */6 * * *')
  async scheduleOverdueCheck() {
    this.logger.log('Scheduling overdue invoice check...');

    const now = new Date();

    // find issued invoices past due date
    const overdueInvoices = await this.invoiceRepo.find({
      where: {
        status: InvoiceStatus.ISSUED,
        due_date: LessThan(now),
      },
    });

    this.logger.log(
      `Found ${overdueInvoices.length} overdue invoices`,
    );

    // enqueue each invoice as separate job
    for (const invoice of overdueInvoices) {
      await this.overdueQueue.add(
        'process-overdue',
        { invoiceId: invoice.id },
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
  @Process('process-overdue')
  async processOverdue(job: Job<{ invoiceId: string }>) {
    const { invoiceId } = job.data;
    this.logger.log(`Processing overdue invoice: ${invoiceId}`);

    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['subscription'],
    });

    if (!invoice) {
      this.logger.warn(`Invoice ${invoiceId} not found`);
      return;
    }

    // mark invoice as overdue
    invoice.status = InvoiceStatus.OVERDUE;
    await this.invoiceRepo.save(invoice);

    // mark subscription as past_due
    const subscription = await this.subRepo.findOne({
      where: { id: invoice.subscription_id },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      subscription.past_due_since = new Date();
      await this.subRepo.save(subscription);
    }

    this.logger.log(
      `Invoice ${invoiceId} marked overdue — subscription set to past_due`,
    );
  }
}