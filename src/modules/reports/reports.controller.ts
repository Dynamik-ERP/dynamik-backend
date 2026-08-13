import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATIONS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders/summary')
  getOrdersSummary() {
    return this.reportsService.getOrdersSummary();
  }

  @Get('inventory/turnover')
  getInventoryTurnover() {
    return this.reportsService.getInventoryTurnover();
  }

  @Get('qc/pass-rate')
  getQcPassRate() {
    return this.reportsService.getQcPassRate();
  }
}
