import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';
import { Message } from '../../entities/message.entity.js';
import { Order } from '../../entities/order.entity.js';
import { TelegramModule } from '../telegram/telegram.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Order]),
    TelegramModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
