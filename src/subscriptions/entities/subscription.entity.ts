import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Plan } from '../../plans/entities/plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('subscriptions')
// Composite index — renewal job queries status + next_renewal_date daily
@Index('idx_sub_status_renewal', ['status', 'next_renewal_date'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  current_period_start: Date;

  @Column({ type: 'timestamp' })
  current_period_end: Date;

  // Index: renewal job queries
  @Index('idx_sub_next_renewal')
  @Column({ type: 'timestamp' })
  next_renewal_date: Date;

  // tracks how long subscription is past_due
  @Column({ type: 'timestamp', nullable: true })
  past_due_since: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft delete — billing history must be retained
  @DeleteDateColumn()
  deleted_at: Date;

  // FK: customer_id
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: string;

  // FK: plan_id
  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column()
  plan_id: string;
}