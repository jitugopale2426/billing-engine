import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // POST /plans
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new plan' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  // GET /plans
  @Get()
  @ApiOperation({ summary: 'Get all plans with pagination' })
  findAll(@Query() dto: PaginationDto) {
    return this.plansService.findAll(dto);
  }

  // GET /plans/active
  // Public endpoint — no auth required
  @Get('active')
  @ApiOperation({ summary: 'Get all active plans (public)' })
  findAllActive() {
    return this.plansService.findAllActive();
  }

  // GET /plans/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get single plan by id' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  // PATCH /plans/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  // DELETE /plans/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}