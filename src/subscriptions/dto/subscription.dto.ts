import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ example: 'uuid-of-plan' })
  @IsUUID()
  plan_id: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ example: 'Cancelling due to high cost' })
  @IsOptional()
  @IsString()
  reason?: string;
}