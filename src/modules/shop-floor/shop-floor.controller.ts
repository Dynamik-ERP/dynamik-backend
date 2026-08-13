import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ShopFloorService } from './shop-floor.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole, MilestoneDepartment } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopFloorController {
  constructor(private readonly shopFloorService: ShopFloorService) {}

  @Get('inbox')
  @Roles(UserRole.CUTTING, UserRole.CNC, UserRole.EDGE_BANDING, UserRole.ADMIN)
  getInbox(@Query('department') department: MilestoneDepartment) {
    return this.shopFloorService.getJobsInbox(department);
  }

  @Post(':orderId/acknowledge')
  @Roles(UserRole.CUTTING, UserRole.CNC, UserRole.EDGE_BANDING)
  acknowledge(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Query('department') department: MilestoneDepartment,
    @CurrentUser() user: User,
  ) {
    return this.shopFloorService.acknowledge(orderId, department, user.id);
  }

  @Post(':orderId/complete')
  @Roles(UserRole.CUTTING, UserRole.CNC, UserRole.EDGE_BANDING)
  complete(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Query('department') department: MilestoneDepartment,
    @CurrentUser() user: User,
  ) {
    return this.shopFloorService.complete(orderId, department, user.id);
  }
}
