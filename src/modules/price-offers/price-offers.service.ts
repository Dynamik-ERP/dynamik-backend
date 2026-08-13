import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PriceOffer } from '../../entities/price-offer.entity.js';
import { Order } from '../../entities/order.entity.js';
import { PriceOfferStatus, OrderStatus } from '../../entities/enums.js';
import { CreatePriceOfferDto } from './dto/create-price-offer.dto.js';

@Injectable()
export class PriceOffersService {
  constructor(
    @InjectRepository(PriceOffer)
    private readonly offerRepo: Repository<PriceOffer>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(orderId: string, dto: CreatePriceOfferDto, createdById: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.DRAFT) {
      order.status = OrderStatus.IN_PROGRESS;
      await this.orderRepo.save(order);
    }

    const offer = this.offerRepo.create({
      order_id: orderId,
      amount: dto.amount.toString(),
      status: PriceOfferStatus.PENDING,
      created_by: createdById,
    });

    const saved = await this.offerRepo.save(offer);
    this.eventEmitter.emit('price-offer.created', { orderId, offerId: saved.id });
    return saved;
  }

  async approve(offerId: string) {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: { order: true },
    });
    if (!offer) {
      throw new NotFoundException('Price offer not found');
    }
    if (offer.status !== PriceOfferStatus.PENDING) {
      throw new BadRequestException('Price offer is not in pending state');
    }

    offer.status = PriceOfferStatus.APPROVED;
    await this.offerRepo.save(offer);

    this.eventEmitter.emit('price-offer.approved', { orderId: offer.order_id, offerId });
    return offer;
  }

  async requestRevision(offerId: string) {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Price offer not found');
    }
    if (offer.status !== PriceOfferStatus.PENDING) {
      throw new BadRequestException('Price offer is not in pending state');
    }

    offer.status = PriceOfferStatus.REVISION_REQUESTED;
    await this.offerRepo.save(offer);

    this.eventEmitter.emit('price-offer.revision-requested', { orderId: offer.order_id, offerId });
    return offer;
  }

  async findByOrder(orderId: string) {
    return this.offerRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });
  }
}
