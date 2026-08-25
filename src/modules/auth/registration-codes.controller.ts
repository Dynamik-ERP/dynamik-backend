import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateRegistrationCodeDto } from './dto/create-registration-code.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';

@Controller('registration-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RegistrationCodesController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  createCode(@Body() dto: CreateRegistrationCodeDto, @CurrentUser() user: User) {
    return this.authService.createRegistrationCode(dto, user.id);
  }

  @Get()
  listCodes() {
    return this.authService.listRegistrationCodes();
  }
}
