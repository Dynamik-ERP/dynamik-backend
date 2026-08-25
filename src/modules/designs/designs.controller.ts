import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { DesignsService } from './designs.service.js';
import { SubmitDesignDto } from './dto/submit-design.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Post('orders/:orderId/route-design')
  @Roles(UserRole.ADMIN)
  routeDesign(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Body('designer_id') bodyDesignerId: string,
    @CurrentUser() user: User,
  ) {
    return this.designsService.routeDesign(orderId, bodyDesignerId || user.id);
  }

  @Get('designs')
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  findAll() {
    return this.designsService.findAll();
  }

  @Get('orders/:orderId/designs')
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  findByOrder(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.designsService.findByOrder(orderId);
  }

  @Post('designs/:id/submit')
  @Roles(UserRole.DESIGN)
  submit(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: SubmitDesignDto,
  ) {
    return this.designsService.submit(id, dto);
  }

  @Post('designs/:id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id', UuidValidationPipe) id: string) {
    return this.designsService.approve(id);
  }

  @Post('designs/:id/request-revision')
  @Roles(UserRole.ADMIN)
  requestRevision(@Param('id', UuidValidationPipe) id: string) {
    return this.designsService.requestRevision(id);
  }
}
