import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { UserRole } from '../../entities/enums.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { VendorsService } from './vendors.service.js';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.WAREHOUSE)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.vendorsService.findAll(pagination);
  }

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', UuidValidationPipe) id: string, @Body() dto: CreateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id', UuidValidationPipe) id: string) {
    return this.vendorsService.softDelete(id);
  }
}
