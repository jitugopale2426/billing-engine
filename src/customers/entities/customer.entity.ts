import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  // Index: email - primary lookup key
  @Index('idx_customer_email', { unique: true })
  @Column({ unique: true, length: 255 })
  email: string;

  // example: { address, city, state, country, pincode }
  @Column({ type: 'jsonb', nullable: true })
  billing_details: Record<string, string>;

  // webhook_url (called when invoice is generated)
  @Column({ nullable: true, length: 500 })
  webhook_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Soft delete — billing history must be retained
  @DeleteDateColumn()
  deleted_at: Date;
}