import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service.js';
import { ClientsController } from './clients.controller.js';
import { User } from '../../entities/user.entity.js';
import { ClientDesignerAssignment } from '../../entities/client-designer-assignment.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, ClientDesignerAssignment, Order])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
