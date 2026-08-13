import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionMilestone } from '../../entities/production-milestone.entity.js';
import { Order } from '../../entities/order.entity.js';
import { MilestoneDepartment, MilestoneEvent, OrderStatus } from '../../entities/enums.js';

const DEPARTMENT_ORDER: MilestoneDepartment[] = [
  MilestoneDepartment.CUTTING,
  MilestoneDepartment.CNC,
  MilestoneDepartment.EDGE_BANDING,
];

@Injectable()
export class ShopFloorService {
  constructor(
    @InjectRepository(ProductionMilestone)
    private readonly milestoneRepo: Repository<ProductionMilestone>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getJobsInbox(department: MilestoneDepartment) {
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.IN_PRODUCTION },
      relations: { client: true },
    });

    const result = [];
    for (const order of orders) {
      const milestones = await this.milestoneRepo.find({
        where: { order_id: order.id, department },
      });
      const isDone = milestones.some((m) => m.event_type === MilestoneEvent.DONE);
      if (!isDone) {
        result.push({ order, milestones });
      }
    }
    return result;
  }

  async acknowledge(orderId: string, department: MilestoneDepartment, actorId: string) {
    const deptIndex = DEPARTMENT_ORDER.indexOf(department);
    if (deptIndex > 0) {
      const priorDept = DEPARTMENT_ORDER[deptIndex - 1];
      const priorDone = await this.milestoneRepo.findOne({
        where: {
          order_id: orderId,
          department: priorDept,
          event_type: MilestoneEvent.DONE,
        },
      });
      if (!priorDone) {
        throw new ConflictException(`Prior phase (${priorDept}) is not completed yet`);
      }
    }

    const existing = await this.milestoneRepo.findOne({
      where: {
        order_id: orderId,
        department,
        event_type: MilestoneEvent.ACKNOWLEDGED,
      },
    });
    if (existing) {
      throw new ConflictException('Job already acknowledged');
    }

    const milestone = this.milestoneRepo.create({
      order_id: orderId,
      department,
      event_type: MilestoneEvent.ACKNOWLEDGED,
      actor_id: actorId,
      timestamp: new Date(),
    });
    return this.milestoneRepo.save(milestone);
  }

  async complete(orderId: string, department: MilestoneDepartment, actorId: string) {
    const ack = await this.milestoneRepo.findOne({
      where: {
        order_id: orderId,
        department,
        event_type: MilestoneEvent.ACKNOWLEDGED,
      },
    });
    if (!ack) {
      throw new ConflictException('Job must be acknowledged before completion');
    }

    const existing = await this.milestoneRepo.findOne({
      where: {
        order_id: orderId,
        department,
        event_type: MilestoneEvent.DONE,
      },
    });
    if (existing) {
      throw new ConflictException('Job already completed');
    }

    const milestone = this.milestoneRepo.create({
      order_id: orderId,
      department,
      event_type: MilestoneEvent.DONE,
      actor_id: actorId,
      timestamp: new Date(),
    });
    const saved = await this.milestoneRepo.save(milestone);

    this.eventEmitter.emit('milestone.completed', { orderId, department });
    return saved;
  }
}
