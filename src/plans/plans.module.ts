import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [
    // registers Plan entity with TypeORM
    TypeOrmModule.forFeature([Plan]),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  // export service
  exports: [PlansService],
})
export class PlansModule {}