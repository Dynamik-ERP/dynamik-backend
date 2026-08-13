import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseService } from './warehouse.service.js';
import { WarehouseController } from './warehouse.controller.js';
import { InventoryItem } from '../../entities/inventory-item.entity.js';
import { MaterialTransaction } from '../../entities/material-transaction.entity.js';
import { ProcurementRequest } from '../../entities/procurement-request.entity.js';
import { ProcurementRequestItem } from '../../entities/procurement-request-item.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, MaterialTransaction, ProcurementRequest, ProcurementRequestItem])],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
