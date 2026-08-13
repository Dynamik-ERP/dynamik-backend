import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingService } from './scheduling.service.js';
import { SchedulingController } from './scheduling.controller.js';
import { ProductionSchedule } from '../../entities/production-schedule.entity.js';
import { CuttingList } from '../../entities/cutting-list.entity.js';
import { BillOfMaterials } from '../../entities/bill-of-materials.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionSchedule, CuttingList, BillOfMaterials, Order])],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
