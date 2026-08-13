import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopFloorService } from './shop-floor.service.js';
import { ShopFloorController } from './shop-floor.controller.js';
import { ProductionMilestone } from '../../entities/production-milestone.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionMilestone, Order])],
  controllers: [ShopFloorController],
  providers: [ShopFloorService],
  exports: [ShopFloorService],
})
export class ShopFloorModule {}
