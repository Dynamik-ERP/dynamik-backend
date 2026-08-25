import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FilterOrdersDto } from './dto/filter-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../entities/user.entity.js';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DESIGN, UserRole.OPERATIONS, UserRole.CLIENT)
  findAll(@Query() filters: FilterOrdersDto, @CurrentUser() user: User) {
    if (user.role === UserRole.CLIENT) {
      filters.client_id = user.id;
    }
    return this.ordersService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DESIGN, UserRole.OPERATIONS)
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', UuidValidationPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Post(':id/assign-designer')
  @Roles(UserRole.ADMIN)
  assignDesigner(
    @Param('id', UuidValidationPipe) id: string,
    @Body('designer_id') designerId: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.assignDesigner(id, designerId, user.id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(@Param('id', UuidValidationPipe) id: string) {
    return this.ordersService.cancel(id);
  }
}
