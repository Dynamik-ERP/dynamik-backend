import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QcCheck } from '../../entities/qc-check.entity.js';
import { Order } from '../../entities/order.entity.js';
import { OrderStatus } from '../../entities/enums.js';
import { CreateQcCheckDto } from './dto/create-qc-check.dto.js';

@Injectable()
export class QcService {
  constructor(
    @InjectRepository(QcCheck)
    private readonly qcRepo: Repository<QcCheck>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createCheck(dto: CreateQcCheckDto, inspectorId: string) {
    const check = this.qcRepo.create({
      order_id: dto.order_id,
      station: dto.station,
      result: dto.result,
      inspector_id: inspectorId,
      notes: dto.notes || null,
      checked_at: new Date(),
    });
    const saved = await this.qcRepo.save(check);
    this.eventEmitter.emit('qc.checked', { orderId: dto.order_id, result: dto.result });
    return saved;
  }

  async getChecksByOrder(orderId: string) {
    return this.qcRepo.find({
      where: { order_id: orderId },
      relations: { inspector: true },
      order: { checked_at: 'ASC' },
    });
  }

  async finalClearance(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.IN_PRODUCTION) {
      throw new BadRequestException('Order must be in production for final clearance');
    }

    const checks = await this.qcRepo.find({ where: { order_id: orderId } });
    const hasFailure = checks.some((c) => c.result === 'fail');
    if (hasFailure) {
      throw new BadRequestException('Cannot clear order with failing QC checks');
    }

    order.status = OrderStatus.COMPLETED;
    await this.orderRepo.save(order);
    this.eventEmitter.emit('order.completed', { orderId });
    return order;
  }
}
