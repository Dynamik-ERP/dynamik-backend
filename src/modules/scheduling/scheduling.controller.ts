import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { CreateCuttingListDto } from './dto/create-cutting-list.dto.js';
import { CreateBomDto } from './dto/create-bom.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('orders/:orderId/schedule')
  @Roles(UserRole.OPERATIONS, UserRole.ADMIN)
  createSchedule(
    @Param('orderId', UuidValidationPipe) orderId: string,
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.schedulingService.createSchedule(orderId, dto, user.id);
  }

  @Get('schedules')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS)
  getSchedules() {
    return this.schedulingService.getSchedules();
  }

  @Get('cutting-lists')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.CUTTING, UserRole.CNC)
  getCuttingLists(@Query() pagination: PaginationDto) {
    return this.schedulingService.getCuttingLists(pagination.page, pagination.limit);
  }

  @Post('cutting-lists')
  @Roles(UserRole.OPERATIONS, UserRole.ADMIN)
  createCuttingList(@Body() dto: CreateCuttingListDto, @CurrentUser() user: User) {
    return this.schedulingService.createCuttingList(dto, user.id);
  }

  @Post('cutting-lists/:id/approve')
  @Roles(UserRole.ADMIN)
  approveCuttingList(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.schedulingService.approveCuttingList(id, user.id);
  }

  @Post('cutting-lists/:id/decline')
  @Roles(UserRole.ADMIN)
  declineCuttingList(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.schedulingService.declineCuttingList(id, user.id);
  }

  @Get('bom')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.WAREHOUSE, UserRole.DESIGN)
  getBom(@Query() pagination: PaginationDto) {
    return this.schedulingService.getBom(pagination.page, pagination.limit);
  }

  @Post('bom')
  @Roles(UserRole.OPERATIONS, UserRole.ADMIN)
  createBom(@Body() dto: CreateBomDto, @CurrentUser() user: User) {
    return this.schedulingService.createBom(dto, user.id);
  }

  @Post('bom/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
  approveBom(@Param('id', UuidValidationPipe) id: string) {
    return this.schedulingService.approveBom(id);
  }

  @Post('orders/:orderId/route-production')
  @Roles(UserRole.OPERATIONS, UserRole.ADMIN)
  routeProduction(@Param('orderId', UuidValidationPipe) orderId: string) {
    return this.schedulingService.routeProduction(orderId);
  }
}
