import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PriceOffersService } from './price-offers.service.js';
import { CreatePriceOfferDto } from './dto/create-price-offer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PriceOffersController {
  constructor(private readonly priceOffersService: PriceOffersService) {}

  @Post('orders/:orderId/price-offers')
  @Roles(UserRole.ADMIN)
  create(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Body() dto: CreatePriceOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.priceOffersService.create(orderId, dto, user.id);
  }

  @Get('orders/:orderId/price-offers')
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  findByOrder(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.priceOffersService.findByOrder(orderId);
  }

  @Post('price-offers/:id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id', UuidValidationPipe) id: string) {
    return this.priceOffersService.approve(id);
  }

  @Post('price-offers/:id/request-revision')
  @Roles(UserRole.ADMIN)
  requestRevision(@Param('id', UuidValidationPipe) id: string) {
    return this.priceOffersService.requestRevision(id);
  }
}
