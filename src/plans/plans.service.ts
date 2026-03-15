import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  // Create new plan
  async create(dto: CreatePlanDto): Promise<Plan> {
    // check duplicate name
    const existing = await this.planRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Plan with name "${dto.name}" already exists`,
      );
    }

    const plan = this.planRepo.create(dto);
    return await this.planRepo.save(plan);
  }

  // Get all plans with pagination (admin)
  async findAll(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [items, total] = await this.planRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto);
  }

  // Get active plans only (public endpoint)
  async findAllActive(): Promise<Plan[]> {
    return await this.planRepo.find({
      where: { is_active: true },
      order: { price: 'ASC' },
    });
  }

  // Get single plan
  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with id "${id}" not found`);
    }
    return plan;
  }

  // Update plan
  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return await this.planRepo.save(plan);
  }

  // Delete plan
async remove(id: string) {
  const plan = await this.findOne(id);
  try {
    await this.planRepo.remove(plan);
    return { message: 'Plan deleted successfully' };
  } catch (error) {
    throw new ConflictException(
      'Cannot delete plan — active subscriptions exist for this plan',
    );
  }
}
}