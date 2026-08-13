import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceOffersService } from './price-offers.service.js';
import { PriceOffersController } from './price-offers.controller.js';
import { PriceOffer } from '../../entities/price-offer.entity.js';
import { Order } from '../../entities/order.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PriceOffer, Order])],
  controllers: [PriceOffersController],
  providers: [PriceOffersService],
  exports: [PriceOffersService],
})
export class PriceOffersModule {}
