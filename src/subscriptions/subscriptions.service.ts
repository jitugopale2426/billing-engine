import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { PlansService } from '../plans/plans.service';
import { CustomersService } from '../customers/customers.service';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { BillingCycle } from '../plans/entities/plan.entity';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly customersService: CustomersService,
    private readonly invoicesService: InvoicesService, 

  ) {}

  // Create new subscription
  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    // verify customer exists
    await this.customersService.findOne(dto.customer_id);

    // verify plan exists
    const plan = await this.plansService.findOne(dto.plan_id);

    // check if customer already has active subscription
    const existing = await this.subRepo.findOne({
      where: {
        customer_id: dto.customer_id,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Customer already has an active subscription',
      );
    }

    // calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, plan.billing_cycle);

    const subscription = this.subRepo.create({
      customer_id: dto.customer_id,
      plan_id: dto.plan_id,
      status: SubscriptionStatus.ACTIVE,
      start_date: now,
      current_period_start: now,
      current_period_end: periodEnd,
      next_renewal_date: periodEnd,
    });

    const savedSubscription = await this.subRepo.save(subscription);

    // generate invoice on first subscription creation
    const subscriptionWithRelations = await this.findOne(savedSubscription.id);
    await this.invoicesService.generateInvoice(subscriptionWithRelations);

    return savedSubscription;
  }

  // Get all subscriptions with pagination
  async findAll(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [items, total] = await this.subRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer', 'plan'],
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto);
  }

  // Get single subscription
  async findOne(id: string): Promise<Subscription> {
    const sub = await this.subRepo.findOne({
      where: { id },
      relations: ['customer', 'plan'],
    });
    if (!sub) {
      throw new NotFoundException(
        `Subscription with id "${id}" not found`,
      );
    }
    return sub;
  }

  // Get subscriptions by customer
  async findByCustomer(customerId: string, dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [items, total] = await this.subRepo.findAndCount({
      where: { customer_id: customerId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto);
  }

  // Cancel subscription
  async cancel(id: string): Promise<Subscription> {
    const sub = await this.findOne(id);

    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        'Subscription is already cancelled',
      );
    }

    sub.status = SubscriptionStatus.CANCELLED;
    return await this.subRepo.save(sub);
  }

  // Calculate period end date
  private calculatePeriodEnd(
    startDate: Date,
    billingCycle: BillingCycle,
  ): Date {
    const end = new Date(startDate);
    if (billingCycle === BillingCycle.MONTHLY) {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }
}