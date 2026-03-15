import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class RecordUsageDto {
  @ApiProperty({ example: 'uuid-of-subscription' })
  @IsUUID()
  subscription_id: string;

  @ApiProperty({
    example: 'api_calls',
    description: 'Type of resource: api_calls, users, storage_gb',
  })
  @IsString()
  @MaxLength(100)
  resource_type: string;

  @ApiProperty({
    example: 150,
    description: 'Amount of resource used',
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}