import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignsService } from './designs.service.js';
import { DesignsController } from './designs.controller.js';
import { Design } from '../../entities/design.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Design, Order])],
  controllers: [DesignsController],
  providers: [DesignsService],
  exports: [DesignsService],
})
export class DesignsModule {}
