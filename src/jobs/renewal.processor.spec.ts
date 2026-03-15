import { Test, TestingModule } from '@nestjs/testing';
import { RenewalProcessor } from './renewal.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { getQueueToken } from '@nestjs/bull';
import { BillingCycle } from '../plans/entities/plan.entity';

const mockSubRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

const mockInvoicesService = {
  generateInvoice: jest.fn(),
};

describe('RenewalProcessor', () => {
  let processor: RenewalProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenewalProcessor,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubRepo,
        },
        {
          provide: getQueueToken('renewal'),
          useValue: mockQueue,
        },
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    }).compile();

    processor = module.get<RenewalProcessor>(RenewalProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleDailyRenewal', () => {
    it('should enqueue renewal job for each active subscription', async () => {
      mockSubRepo.find.mockResolvedValue([
        { id: 'sub-1' },
        { id: 'sub-2' },
      ]);

      await processor.scheduleDailyRenewal();

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-renewal',
        { subscriptionId: 'sub-1' },
        expect.any(Object),
      );
    });

    it('should not enqueue if no subscriptions due', async () => {
      mockSubRepo.find.mockResolvedValue([]);

      await processor.scheduleDailyRenewal();

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('processRenewal', () => {
    const mockSubscription = {
      id: 'sub-1',
      status: SubscriptionStatus.ACTIVE,
      plan: {
        billing_cycle: BillingCycle.MONTHLY,
        price: 99900,
      },
      current_period_start: new Date(),
      current_period_end: new Date(),
      next_renewal_date: new Date(),
    };

    it('should generate invoice on payment success', async () => {
      mockSubRepo.findOne.mockResolvedValue(mockSubscription);
      mockInvoicesService.generateInvoice.mockResolvedValue({});
      mockSubRepo.save.mockResolvedValue(mockSubscription);
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      const job = { data: { subscriptionId: 'sub-1' } } as any;
      await processor.processRenewal(job);

      expect(mockInvoicesService.generateInvoice).toHaveBeenCalled();
      expect(mockSubRepo.save).toHaveBeenCalled();
    });

    it('should mark subscription past_due on payment failure', async () => {
      mockSubRepo.findOne.mockResolvedValue({ ...mockSubscription });
      mockSubRepo.save.mockResolvedValue({});
      jest.spyOn(Math, 'random').mockReturnValue(0.99);

      const job = { data: { subscriptionId: 'sub-1' } } as any;
      await processor.processRenewal(job);

      expect(mockInvoicesService.generateInvoice).not.toHaveBeenCalled();
      expect(mockSubRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
        }),
      );
    });

    it('should return early if subscription not found', async () => {
      mockSubRepo.findOne.mockResolvedValue(null);

      const job = { data: { subscriptionId: 'not-exist' } } as any;
      await processor.processRenewal(job);

      expect(mockInvoicesService.generateInvoice).not.toHaveBeenCalled();
    });
  });
});