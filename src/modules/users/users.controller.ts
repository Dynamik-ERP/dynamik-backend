import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { UserRole } from '../../entities/enums.js';
import { FilterUsersDto } from './dto/filter-users.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() filters: FilterUsersDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', UuidValidationPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id', UuidValidationPipe) id: string) {
    return this.usersService.softDelete(id);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id', UuidValidationPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Post(':id/unlock')
  unlock(@Param('id', UuidValidationPipe) id: string) {
    return this.usersService.unlock(id);
  }
}
