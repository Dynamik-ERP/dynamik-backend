import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionSchedule } from '../../entities/production-schedule.entity.js';
import { CuttingList } from '../../entities/cutting-list.entity.js';
import { BillOfMaterials } from '../../entities/bill-of-materials.entity.js';
import { Order } from '../../entities/order.entity.js';
import { OrderStatus, ApprovalStatus } from '../../entities/enums.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { CreateCuttingListDto } from './dto/create-cutting-list.dto.js';
import { CreateBomDto } from './dto/create-bom.dto.js';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(ProductionSchedule)
    private readonly scheduleRepo: Repository<ProductionSchedule>,
    @InjectRepository(CuttingList)
    private readonly cuttingListRepo: Repository<CuttingList>,
    @InjectRepository(BillOfMaterials)
    private readonly bomRepo: Repository<BillOfMaterials>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSchedule(orderId: string, dto: CreateScheduleDto, coordinatorId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.READY_FOR_PRODUCTION) {
      throw new BadRequestException('Order must be ready_for_production to schedule');
    }

    const schedule = this.scheduleRepo.create({
      order_id: orderId,
      delivery_date: dto.delivery_date,
      production_start: dto.production_start,
      production_end: dto.production_end,
      coordinator_id: coordinatorId,
    });
    return this.scheduleRepo.save(schedule);
  }

  async getSchedules() {
    return this.scheduleRepo.find({
      relations: { order: true, coordinator: true },
      order: { production_start: 'ASC' },
    });
  }

  async createCuttingList(dto: CreateCuttingListDto, createdById: string) {
    const list = this.cuttingListRepo.create({
      order_id: dto.order_id,
      status: ApprovalStatus.PENDING,
      created_by: createdById,
    });
    return this.cuttingListRepo.save(list);
  }

  async approveCuttingList(id: string, decidedById: string) {
    const list = await this.cuttingListRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException('Cutting list not found');
    list.status = ApprovalStatus.APPROVED;
    list.decided_by = decidedById;
    await this.cuttingListRepo.save(list);
    this.eventEmitter.emit('cutting-list.approved', { orderId: list.order_id });
    return list;
  }

  async declineCuttingList(id: string, decidedById: string) {
    const list = await this.cuttingListRepo.findOne({ where: { id } });
    if (!list) throw new NotFoundException('Cutting list not found');
    list.status = ApprovalStatus.DECLINED;
    list.decided_by = decidedById;
    return this.cuttingListRepo.save(list);
  }

  async createBom(dto: CreateBomDto, createdById: string) {
    const bom = this.bomRepo.create({
      order_id: dto.order_id,
      boards: dto.boards || {},
      colors: dto.colors || {},
      accessories: dto.accessories || {},
      edging: dto.edging || {},
      status: ApprovalStatus.PENDING,
    });
    return this.bomRepo.save(bom);
  }

  async approveBom(id: string) {
    const bom = await this.bomRepo.findOne({ where: { id } });
    if (!bom) throw new NotFoundException('BOM not found');
    bom.status = ApprovalStatus.APPROVED;
    await this.bomRepo.save(bom);
    this.eventEmitter.emit('bom.approved', { orderId: bom.order_id });
    return bom;
  }

  async routeProduction(orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.READY_FOR_PRODUCTION) {
      throw new BadRequestException('Order must be ready_for_production');
    }
    order.status = OrderStatus.IN_PRODUCTION;
    await this.orderRepo.save(order);
    this.eventEmitter.emit('order.in_production', { orderId });
    return order;
  }
}
