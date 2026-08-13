import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { QcService } from './qc.service.js';
import { CreateQcCheckDto } from './dto/create-qc-check.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post('qc-checks')
  @Roles(UserRole.QC)
  createCheck(@Body() dto: CreateQcCheckDto, @CurrentUser() user: User) {
    return this.qcService.createCheck(dto, user.id);
  }

  @Get('orders/:orderId/qc-checks')
  @Roles(UserRole.QC, UserRole.ADMIN, UserRole.OPERATIONS)
  getChecksByOrder(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.qcService.getChecksByOrder(orderId);
  }

  @Post('orders/:orderId/final-clearance')
  @Roles(UserRole.QC, UserRole.ADMIN)
  finalClearance(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.qcService.finalClearance(orderId);
  }
}
