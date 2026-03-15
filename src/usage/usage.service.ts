import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsageEvent } from './entities/usage-event.entity';
import { RecordUsageDto } from './dto/usage.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageEvent)
    private readonly usageRepo: Repository<UsageEvent>,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // Record a usage event
  async recordUsage(dto: RecordUsageDto): Promise<UsageEvent> {
    // verify subscription exists
    await this.subscriptionsService.findOne(dto.subscription_id);

    const event = this.usageRepo.create({
      subscription_id: dto.subscription_id,
      resource_type: dto.resource_type,
      quantity: dto.quantity,
    });

    // invalidate usage cache when new event recorded
    await this.cacheManager.del(`usage:${dto.subscription_id}`);

    return await this.usageRepo.save(event);
  }

  // Get usage summary vs plan limits
  // Document says: cache with 30 second TTL
  async getUsageSummary(subscriptionId: string) {
    // check cache first
    const cacheKey = `usage:${subscriptionId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // get subscription with plan
    const subscription = await this.subscriptionsService.findOne(
      subscriptionId,
    );

    // get total usage per resource_type
    const usageData = await this.usageRepo
      .createQueryBuilder('usage')
      .select('usage.resource_type', 'resource_type')
      .addSelect('SUM(usage.quantity)', 'total_used')
      .where('usage.subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .andWhere('usage.recorded_at >= :periodStart', {
        periodStart: subscription.current_period_start,
      })
      .andWhere('usage.recorded_at <= :periodEnd', {
        periodEnd: subscription.current_period_end,
      })
      .groupBy('usage.resource_type')
      .getRawMany();

    // compare usage vs plan limits
    const limits = subscription.plan.feature_limits;
    const summary = {};

    for (const resource of Object.keys(limits)) {
      const used = usageData.find(
        (u) => u.resource_type === resource,
      );
      const total_used = used ? parseFloat(used.total_used) : 0;
      const limit = limits[resource];

      summary[resource] = {
        used: total_used,
        limit,
        remaining: Math.max(0, limit - total_used),
        percentage: Math.round((total_used / limit) * 100),
      };
    }

    const result = {
      subscription_id: subscriptionId,
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end,
      usage: summary,
    };

    // cache for 30 seconds
    // Document says: short TTL 30 seconds for usage summary
    await this.cacheManager.set(cacheKey, result, 30000);

    return result;
  }
}