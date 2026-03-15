import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import { BillingCycle } from '../plans/entities/plan.entity';

const STATS_CACHE_KEY = 'stats:admin';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getAdminStats() {
    // check cache first
    // Document says: cache stats with 2 minute TTL
    const cached = await this.cacheManager.get(STATS_CACHE_KEY);
    if (cached) return cached;

    // total active subscriptions
    const total_active_subscriptions = await this.subRepo.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // MRR calculation
    // monthly plans → price
    // annual plans  → price / 12
    const activeSubscriptions = await this.subRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      if (sub.plan.billing_cycle === BillingCycle.MONTHLY) {
        mrr += Number(sub.plan.price);
      } else {
        // annual → divide by 12 for monthly equivalent
        mrr += Math.round(Number(sub.plan.price) / 12);
      }
    }

    // overdue invoice count
    const overdue_invoice_count = await this.invoiceRepo.count({
      where: { status: InvoiceStatus.OVERDUE },
    });

    const stats = {
      total_active_subscriptions,
      mrr,
      mrr_formatted: `₹${(mrr / 100).toFixed(2)}`,
      overdue_invoice_count,
      generated_at: new Date().toISOString(),
    };

    // cache for 2 minutes
    // Document says: 2 minute TTL for stats
    await this.cacheManager.set(STATS_CACHE_KEY, stats, 120000);

    return stats;
  }
}