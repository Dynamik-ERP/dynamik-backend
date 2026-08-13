import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../../entities/notification.entity.js';
import { User } from '../../entities/user.entity.js';
import { Order } from '../../entities/order.entity.js';
import { UserRole } from '../../entities/enums.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async findByUser(userId: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [data, total] = await this.notificationRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user_id: userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read_status = true;
    return this.notificationRepo.save(notification);
  }

  async createNotification(userId: string, type: string, message: string, orderId?: string) {
    const notification = this.notificationRepo.create({
      user_id: userId,
      order_id: orderId || null,
      type,
      message,
      read_status: false,
    });
    return this.notificationRepo.save(notification);
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: { orderId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: payload.orderId }, relations: { client: true } });
    if (!order) return;
    const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
    for (const admin of admins) {
      const notification = await this.createNotification(
        admin.id,
        'order.created',
        `New order created for ${order.client?.full_name || 'Unknown client'}`,
        payload.orderId,
      );
      this.gateway.sendToUser(admin.id, 'notification:new', notification);
    }
    this.gateway.sendToRole(UserRole.ADMIN, 'order:created', { orderId: payload.orderId });
  }

  @OnEvent('order.completed')
  async handleOrderCompleted(payload: { orderId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: payload.orderId }, relations: { client: true } });
    if (!order) return;
    const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
    const recipients = new Set<string>([order.client_id, ...admins.map((admin) => admin.id)]);
    if (order.handled_by_designer_id) recipients.add(order.handled_by_designer_id);

    for (const userId of recipients) {
      const notification = await this.createNotification(
        userId,
        'order.completed',
        `Order ${payload.orderId.slice(0, 8)} has been completed`,
        payload.orderId,
      );
      this.gateway.sendToUser(userId, 'notification:new', notification);
    }
  }

  @OnEvent('order.ready_for_production')
  async handleOrderReadyForProduction(payload: { orderId: string }) {
    const operationsUsers = await this.userRepo.find({ where: { role: UserRole.OPERATIONS } });
    for (const user of operationsUsers) {
      const notification = await this.createNotification(
        user.id,
        'order.ready_for_production',
        'Order is ready for production scheduling',
        payload.orderId,
      );
      this.gateway.sendToUser(user.id, 'notification:new', notification);
    }
  }

  @OnEvent('price-offer.created')
  async handlePriceOfferCreated(payload: { orderId: string; offerId: string }) {
    const order = await this.orderRepo.findOne({ where: { id: payload.orderId } });
    if (!order) return;
    const notification = await this.createNotification(
      order.client_id,
      'price-offer.created',
      'New price offer received for your order',
      payload.orderId,
    );
    this.gateway.sendToUser(order.client_id, 'notification:new', notification);
  }

  @OnEvent('design.submitted')
  async handleDesignSubmitted(payload: { orderId: string }) {
    const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN } });
    for (const admin of admins) {
      const notification = await this.createNotification(
        admin.id,
        'design.submitted',
        'A design draft has been submitted for review',
        payload.orderId,
      );
      this.gateway.sendToUser(admin.id, 'notification:new', notification);
    }
  }

  @OnEvent('milestone.completed')
  async handleMilestoneCompleted(payload: { orderId: string; department: string }) {
    const operationsUsers = await this.userRepo.find({ where: { role: UserRole.OPERATIONS } });
    for (const user of operationsUsers) {
      const notification = await this.createNotification(
        user.id,
        'milestone.completed',
        `${payload.department} phase completed`,
        payload.orderId,
      );
      this.gateway.sendToUser(user.id, 'notification:new', notification);
    }
  }

  @OnEvent('message.created')
  async handleMessageCreated(payload: { orderId: string; senderId: string; body: string }) {
    const order = await this.orderRepo.findOne({ where: { id: payload.orderId } });
    if (!order) return;

    const recipients = new Set<string>();
    if (payload.senderId !== order.client_id) recipients.add(order.client_id);
    if (order.handled_by_designer_id && payload.senderId !== order.handled_by_designer_id) {
      recipients.add(order.handled_by_designer_id);
    }

    for (const userId of recipients) {
      this.gateway.sendToUser(userId, 'message:new', {
        orderId: payload.orderId,
        body: payload.body,
      });
    }
  }
}
