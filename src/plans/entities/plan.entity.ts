import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Index: plan name
  @Index('idx_plan_name')
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: BillingCycle })
  billing_cycle: BillingCycle;

  // price stored in paise to avoid float issues
  // example: ₹999 = 99900 paise
  @Column({ type: 'bigint' })
  price: number;

  // Limits for plan features
  // Example : { max_api_calls: 10000, max_users: 5, max_storage_gb: 10 }
  @Column({ type: 'jsonb' })
  feature_limits: Record<string, number>;

  // Index used: most list queries filter by is_active
  @Index('idx_plan_is_active')
  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}