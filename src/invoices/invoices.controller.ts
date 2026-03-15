import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // GET /invoices/customer/:customerId
  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all invoices for a customer' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.invoicesService.findByCustomer(customerId, dto);
  }

  // GET /invoices/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get single invoice with line items' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  // PATCH /invoices/:id/pay
  @Patch(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as paid (mock)' })
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }
}