import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /stats/admin
  // admin endpoint for stats
  // Redis cached for 2 minutes
  @Get('admin')
  @ApiOperation({
    summary: 'Get admin stats - active subs, MRR, overdue invoices',
  })
  getAdminStats() {
    return this.statsService.getAdminStats();
  }
}