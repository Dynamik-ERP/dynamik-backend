import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QcService } from './qc.service.js';
import { QcController } from './qc.controller.js';
import { QcCheck } from '../../entities/qc-check.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([QcCheck, Order])],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
