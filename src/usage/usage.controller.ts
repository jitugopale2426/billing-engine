import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { RecordUsageDto } from './dto/usage.dto';

@ApiTags('usage')
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  // POST /usage
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a usage event' })
  recordUsage(@Body() dto: RecordUsageDto) {
    return this.usageService.recordUsage(dto);
  }

  // GET /usage/:subscriptionId/summary
  @Get(':subscriptionId/summary')
  @ApiOperation({
    summary: 'Get usage summary vs plan limits',
  })
  getUsageSummary(@Param('subscriptionId') subscriptionId: string) {
    return this.usageService.getUsageSummary(subscriptionId);
  }
}