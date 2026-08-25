import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateMaterialTransactionDto } from './dto/create-material-transaction.dto.js';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.DESIGN)
  listInventory(@Query() pagination: PaginationDto) {
    return this.warehouseService.listInventory(pagination);
  }

  @Post('inventory')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.warehouseService.createInventoryItem(dto);
  }

  @Post('inventory/:id/adjust')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  adjustInventory(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.warehouseService.adjustInventory(id, dto);
  }

  @Post('material-transactions')
  @Roles(UserRole.WAREHOUSE)
  createTransaction(
    @Body() dto: CreateMaterialTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.warehouseService.createTransaction(dto, user.id);
  }

  @Post('procurement-requests')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
  createProcurementRequest(
    @Body() dto: CreateProcurementRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.warehouseService.createProcurementRequest(dto, user.id);
  }

  @Get('procurement-requests')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
  listProcurementRequests() {
    return this.warehouseService.listProcurementRequests();
  }

  @Post('procurement-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  approveProcurementRequest(@Param('id', UuidValidationPipe) id: string) {
    return this.warehouseService.approveProcurementRequest(id);
  }
}
