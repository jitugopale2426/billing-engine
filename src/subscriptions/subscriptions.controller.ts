import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // POST /subscriptions
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe a customer to a plan' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  // GET /subscriptions
  @Get()
  @ApiOperation({ summary: 'Get all subscriptions with pagination' })
  findAll(@Query() dto: PaginationDto) {
    return this.subscriptionsService.findAll(dto);
  }

  // GET /subscriptions/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get single subscription by id' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  // GET /subscriptions/customer/:customerId
  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all subscriptions by customer' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.subscriptionsService.findByCustomer(customerId, dto);
  }

  // PATCH /subscriptions/:id/cancel
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id);
  }
}