import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('usage_events')
// Composite index — usage summary queries filter by
// subscription_id + resource_type + recorded_at range
@Index('idx_usage_sub_resource_time', [
  'subscription_id',
  'resource_type',
  'recorded_at',
])
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // example: 'api_calls', 'users', 'storage_gb'
  @Column({ length: 100 })
  resource_type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity: number;

  // Index: queries filter events within billing period
  @Index('idx_usage_recorded_at')
  @CreateDateColumn()
  recorded_at: Date;

  // FK: subscription_id
  // CASCADE → if subscription deleted, usage events deleted
  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column()
  subscription_id: string;
}