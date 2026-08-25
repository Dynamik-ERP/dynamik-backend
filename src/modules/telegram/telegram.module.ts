import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service.js';
import { TelegramController } from './telegram.controller.js';
import { User } from '../../entities/user.entity.js';
import { Order } from '../../entities/order.entity.js';
import { Message } from '../../entities/message.entity.js';
import { PriceOffer } from '../../entities/price-offer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Message, PriceOffer])],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
