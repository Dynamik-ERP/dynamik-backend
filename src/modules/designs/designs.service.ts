import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Design } from '../../entities/design.entity.js';
import { Order } from '../../entities/order.entity.js';
import { DesignStatus, OrderStatus } from '../../entities/enums.js';
import { SubmitDesignDto } from './dto/submit-design.dto.js';

@Injectable()
export class DesignsService {
  constructor(
    @InjectRepository(Design)
    private readonly designRepo: Repository<Design>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async routeDesign(orderId: string, designerId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.DRAFT) {
      order.status = OrderStatus.IN_PROGRESS;
      await this.orderRepo.save(order);
    }

    const design = this.designRepo.create({
      order_id: orderId,
      designer_id: designerId,
      status: DesignStatus.DRAFTING,
    });

    const saved = await this.designRepo.save(design);
    this.eventEmitter.emit('design.routed', { orderId, designId: saved.id });
    return saved;
  }

  async submit(designId: string, dto: SubmitDesignDto) {
    const design = await this.designRepo.findOne({ where: { id: designId } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.status !== DesignStatus.DRAFTING && design.status !== DesignStatus.REVISION_REQUESTED) {
      throw new BadRequestException('Design cannot be submitted in current state');
    }

    design.status = DesignStatus.SUBMITTED;
    if (dto.file_url) {
      design.file_url = dto.file_url;
    }
    await this.designRepo.save(design);

    this.eventEmitter.emit('design.submitted', { orderId: design.order_id, designId });
    return design;
  }

  async approve(designId: string) {
    const design = await this.designRepo.findOne({ where: { id: designId } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.status !== DesignStatus.SUBMITTED) {
      throw new BadRequestException('Design must be submitted before approval');
    }

    design.status = DesignStatus.APPROVED;
    await this.designRepo.save(design);

    this.eventEmitter.emit('design.approved', { orderId: design.order_id, designId });
    return design;
  }

  async requestRevision(designId: string) {
    const design = await this.designRepo.findOne({ where: { id: designId } });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    if (design.status !== DesignStatus.SUBMITTED) {
      throw new BadRequestException('Design must be submitted before requesting revision');
    }

    design.status = DesignStatus.REVISION_REQUESTED;
    await this.designRepo.save(design);

    this.eventEmitter.emit('design.revision-requested', { orderId: design.order_id, designId });
    return design;
  }

  async findByOrder(orderId: string) {
    return this.designRepo.find({
      where: { order_id: orderId },
      relations: { designer: true },
      order: { updated_at: 'DESC' },
    });
  }

  async findAll() {
    return this.designRepo.find({
      relations: { designer: true, order: { client: true } },
      order: { updated_at: 'DESC' },
    });
  }
}
