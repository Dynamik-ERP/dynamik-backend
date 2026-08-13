import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message } from '../../entities/message.entity.js';
import { Order } from '../../entities/order.entity.js';
import { MessageChannel, MessageType } from '../../entities/enums.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { TelegramService } from '../telegram/telegram.service.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly telegramService: TelegramService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(orderId: string, senderId: string, dto: CreateMessageDto) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { client: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const message = this.messageRepo.create({
      order_id: orderId,
      sender_id: senderId,
      channel: MessageChannel.WEB,
      message_type: dto.message_type || MessageType.TEXT,
      body: dto.body,
    });

    const saved = await this.messageRepo.save(message);

    if (order.client?.telegram_chat_id) {
      await this.telegramService.sendRelayMessage(order.client.telegram_chat_id, dto.body);
    }

    this.eventEmitter.emit('message.created', {
      orderId,
      messageId: saved.id,
      senderId,
      body: dto.body,
    });

    return saved;
  }

  async findByOrder(orderId: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    const [data, total] = await this.messageRepo.findAndCount({
      where: { order_id: orderId },
      relations: { sender: true },
      order: { created_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
