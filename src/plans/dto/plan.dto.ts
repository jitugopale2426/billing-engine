import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { BillingCycle } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ example: 'Starter' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billing_cycle: BillingCycle;

  @ApiProperty({ example: 99900 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: { max_api_calls: 10000, max_users: 5, max_storage_gb: 10 },
  })
  @IsObject()
  feature_limits: Record<string, number>;
}

export class UpdatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  feature_limits?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}