import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { InvoiceLineItem } from './invoice-line-item.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Human readable invoice number
  // example: INV-2024-000001
  @Index('idx_invoice_number', { unique: true })
  @Column({ unique: true })
  invoice_number: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  // all amounts stored in paise
  @Column({ type: 'bigint', default: 0 })
  subtotal: number;

  @Column({ type: 'bigint', default: 0 })
  tax: number;

  @Column({ type: 'bigint', default: 0 })
  total: number;

  // Index: overdue checker queries issued invoices past due_date
  @Index('idx_invoice_due_date')
  @Column({ type: 'timestamp' })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // FK: subscription_id
  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Index('idx_invoice_subscription_id')
  @Column()
  subscription_id: string;

  @OneToMany(() => InvoiceLineItem, (item) => item.invoice)
  line_items: InvoiceLineItem[];
}