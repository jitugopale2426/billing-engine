import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_line_items')
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // example: 'Pro Plan - Monthly Subscription'
  @Column({ length: 255 })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // unit_price in paise
  @Column({ type: 'bigint' })
  unit_price: number;

  // amount = quantity * unit_price
  @Column({ type: 'bigint' })
  amount: number;

  // FK: invoice_id
  // CASCADE → if invoice deleted, line items deleted too
  @ManyToOne(() => Invoice, (invoice) => invoice.line_items, {
   onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Index('idx_line_item_invoice_id')
  @Column()
  invoice_id: string;
}