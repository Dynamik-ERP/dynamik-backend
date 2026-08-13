import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { ClientDesignerAssignment } from '../../entities/client-designer-assignment.entity.js';
import { User } from '../../entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, ClientDesignerAssignment, User])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
