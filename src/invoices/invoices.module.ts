import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLineItem } from './entities/invoice-line-item.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { WebhookService } from '../common/webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceLineItem]),
  ],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    WebhookService, 
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}