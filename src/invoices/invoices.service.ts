import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { WebhookService } from '../common/webhook.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLineItem)
    private readonly lineItemRepo: Repository<InvoiceLineItem>,
    private readonly webhookService: WebhookService,
  ) {}

  // Generate invoice for a subscription
  async generateInvoice(subscription: Subscription): Promise<Invoice> {
    const count = await this.invoiceRepo.count();
    const invoice_number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const TAX_RATE = parseFloat(process.env.TAX_RATE as string) || 0.18;

    const subtotal = Number(subscription.plan.price);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 7);

    const invoice = this.invoiceRepo.create({
      invoice_number,
      subscription_id: subscription.id,
      status: InvoiceStatus.ISSUED,
      subtotal,
      tax,
      total,
      due_date,
    });

    const savedInvoice = await this.invoiceRepo.save(invoice);

    const lineItem = this.lineItemRepo.create({
      invoice_id: savedInvoice.id,
      description: `${subscription.plan.name} - ${subscription.plan.billing_cycle} subscription`,
      quantity: 1,
      unit_price: subtotal,
      amount: subtotal,
    });

    await this.lineItemRepo.save(lineItem);

    // send webhook if customer has webhook_url
    // webhook failure does NOT break invoice generation
    if (subscription.customer?.webhook_url) {
      await this.webhookService.sendWebhook(
        subscription.customer.webhook_url,
        {
          invoice_id: savedInvoice.id,
          invoice_number: savedInvoice.invoice_number,
          subscription_id: subscription.id,
          amount: total,
          status: InvoiceStatus.ISSUED,
        },
      );
    }

    return savedInvoice;
  }

  // Get all invoices by customer
  async findByCustomer(customerId: string, dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [items, total] = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .innerJoin('invoice.subscription', 'subscription')
      .where('subscription.customer_id = :customerId', { customerId })
      .orderBy('invoice.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(items, total, dto);
  }

  // Get single invoice with line items
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['line_items', 'subscription'],
    });
    if (!invoice) {
      throw new NotFoundException(
        `Invoice with id "${id}" not found`,
      );
    }
    return invoice;
  }

  // Mark invoice as paid (mock)
  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();
    return await this.invoiceRepo.save(invoice);
  }

  // Mark invoice as overdue
  async markAsOverdue(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = InvoiceStatus.OVERDUE;
    return await this.invoiceRepo.save(invoice);
  }
}