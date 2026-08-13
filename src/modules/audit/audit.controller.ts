import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { UserRole } from '../../entities/enums.js';
import { AuditService } from './audit.service.js';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityType/:entityId')
  getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', UuidValidationPipe) entityId: string,
  ) {
    return this.auditService.getByEntity(entityType, entityId);
  }
}
