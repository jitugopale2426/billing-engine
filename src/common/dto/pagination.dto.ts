import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// USED OFFSET pagination because:
// 1. Admin views need to jump to specific pages
// 2. Data does not stream in realtime
// 3. Simpler for frontend to show total count + page numbers
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Used by all services to return paginated data
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Helper function used in every service
export function paginate<T>(
  items: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResult<T> {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 10;
  const total_pages = Math.ceil(total / limit);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
  };
}