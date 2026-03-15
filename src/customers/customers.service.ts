import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

async create(dto: CreateCustomerDto): Promise<Customer> {
  const existing = await this.customerRepo.findOne({
    where: { email: dto.email },
    withDeleted: true, // check soft deleted
  });

  if (existing && !existing.deleted_at) {
    throw new ConflictException(
      `Customer with email "${dto.email}" already exists`,
    );
  }

  if (existing && existing.deleted_at) {
    // restore soft deleted customer
    existing.deleted_at = null as any;
    existing.name = dto.name;
    existing.billing_details = dto.billing_details as Record<string, string>;
    return await this.customerRepo.save(existing);
  }

  const customer = this.customerRepo.create(dto);
  return await this.customerRepo.save(customer);
}

  // Get all customers with pagination
  async findAll(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [items, total] = await this.customerRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto);
  }

  // Get single customer
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with id "${id}" not found`,
      );
    }
    return customer;
  }

  // Update customer
    async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    const updated = await this.customerRepo.save(customer);
    return {
        message: 'Customer updated successfully',
        data: updated,
    };
    }

  // Soft delete customer
  // DeleteDateColumn handles soft delete automatically
  async remove(id: string) {
   const customer = await this.findOne(id);
   await this.customerRepo.softRemove(customer);
   return { message: 'Customer deleted successfully' };
}
}
