import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity.js';
import { Order } from '../../entities/order.entity.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';

@Injectable()
export class InvoicingService {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const order = await this.orderRepo.findOne({ where: { id: dto.order_id } });
    if (!order) throw new NotFoundException('Order not found');
    const taxRate = dto.tax_rate || 0;
    const total = dto.subtotal + dto.subtotal * (taxRate / 100);
    const invoice = this.invoiceRepo.create({
      invoice_number: `INV-${Date.now().toString().slice(-10)}`,
      order_id: order.id,
      client_id: order.client_id,
      subtotal: dto.subtotal.toFixed(2),
      tax_rate: taxRate.toFixed(2),
      total: total.toFixed(2),
      currency: dto.currency || 'ETB',
      status: 'draft',
    });
    return this.invoiceRepo.save(invoice);
  }

  findAll() {
    return this.invoiceRepo.find({ order: { created_at: 'DESC' } });
  }

  async issue(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'draft') throw new BadRequestException('Only draft invoices can be issued');
    invoice.status = 'issued';
    invoice.issued_at = new Date();
    return this.invoiceRepo.save(invoice);
  }

  async markPaid(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'issued') throw new BadRequestException('Only issued invoices can be marked paid');
    invoice.status = 'paid';
    invoice.paid_at = new Date();
    return this.invoiceRepo.save(invoice);
  }
}
