import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../entities/enums.js';
import { ExportService } from './export.service.js';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATIONS)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('orders')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  exportOrders() {
    return this.exportService.exportOrdersCsv();
  }

  @Get('inventory')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory.csv"')
  exportInventory() {
    return this.exportService.exportInventoryCsv();
  }
}
