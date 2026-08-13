import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../entities/invoice.entity.js';
import { Order } from '../../entities/order.entity.js';
import { InvoicingController } from './invoicing.controller.js';
import { InvoicingService } from './invoicing.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Order])],
  controllers: [InvoicingController],
  providers: [InvoicingService],
})
export class InvoicingModule {}
