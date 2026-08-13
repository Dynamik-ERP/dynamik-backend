import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { ClientDesignerAssignment } from '../../entities/client-designer-assignment.entity.js';
import { User } from '../../entities/user.entity.js';
import { OrderStatus, UserRole } from '../../entities/enums.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FilterOrdersDto } from './dto/filter-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ClientDesignerAssignment)
    private readonly assignmentRepo: Repository<ClientDesignerAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto) {
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const client = await manager.findOne(User, { where: { id: dto.client_id, role: UserRole.CLIENT } });
      if (!client) {
        throw new BadRequestException('Client not found');
      }

      const assignment = await manager.findOne(ClientDesignerAssignment, { where: { client_id: dto.client_id } });

      const order = manager.create(Order, {
        client_id: dto.client_id,
        status: OrderStatus.DRAFT,
        handled_by_designer_id: assignment?.designer_id || null,
      });
      const orderResult = await manager.save(order);

      if (dto.items?.length) {
        const items = dto.items.map((item) =>
          manager.create(OrderItem, {
            order_id: orderResult.id,
            item_type: item.item_type,
            quantity: item.quantity,
          }),
        );
        await manager.save(items);
      }

      return orderResult;
    });

    this.eventEmitter.emit('order.created', { orderId: savedOrder.id });
    return this.findOne(savedOrder.id);
  }

  async findAll(filters: FilterOrdersDto) {
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.client', 'client')
      .leftJoinAndSelect('order.handledByDesigner', 'designer')
      .leftJoinAndSelect('order.items', 'items');

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }
    if (filters.client_id) {
      qb.andWhere('order.client_id = :clientId', { clientId: filters.client_id });
    }
    if (filters.designer_id) {
      qb.andWhere('order.handled_by_designer_id = :designerId', { designerId: filters.designer_id });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    qb.orderBy('order.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        client: true,
        handledByDesigner: true,
        items: true,
        priceOffers: true,
        designs: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: { items: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (![OrderStatus.DRAFT, OrderStatus.IN_PROGRESS].includes(order.status)) {
        throw new BadRequestException('Only draft or in-progress orders can be edited');
      }

      if (dto.items) {
        await manager.delete(OrderItem, { order_id: id });
        const items = dto.items.map((item) =>
          manager.create(OrderItem, {
            order_id: id,
            item_type: item.item_type,
            quantity: item.quantity,
          }),
        );
        await manager.save(items);
      }

      return this.findOne(id);
    });
  }

  async cancel(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if ([OrderStatus.IN_PRODUCTION, OrderStatus.COMPLETED].includes(order.status)) {
      throw new BadRequestException('Orders already in production or completed cannot be cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    const saved = await this.orderRepo.save(order);
    this.eventEmitter.emit('order.cancelled', { orderId: id });
    return saved;
  }

  async checkAndTransitionToReady(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: {
        priceOffers: true,
        designs: true,
      },
    });
    if (!order) return;

    const hasApprovedPrice = order.priceOffers?.some((po) => po.status === 'approved');
    const hasApprovedDesign = order.designs?.some((d) => d.status === 'approved');

    if (hasApprovedPrice && hasApprovedDesign && order.status === OrderStatus.IN_PROGRESS) {
      order.status = OrderStatus.READY_FOR_PRODUCTION;
      await this.orderRepo.save(order);
      this.eventEmitter.emit('order.ready_for_production', { orderId });
    }
  }

  @OnEvent('price-offer.approved')
  async handlePriceOfferApproved(payload: { orderId: string }) {
    await this.checkAndTransitionToReady(payload.orderId);
  }

  @OnEvent('design.approved')
  async handleDesignApproved(payload: { orderId: string }) {
    await this.checkAndTransitionToReady(payload.orderId);
  }
}
