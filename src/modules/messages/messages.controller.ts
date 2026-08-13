import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Controller('orders/:orderId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  create(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.create(orderId, user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  findByOrder(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.findByOrder(orderId, pagination);
  }
}
