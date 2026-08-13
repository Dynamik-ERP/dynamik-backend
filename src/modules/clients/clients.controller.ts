import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { AssignDesignerDto } from './dto/assign-designer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  listClients() {
    return this.clientsService.listClients();
  }

  @Post(':id/assign-designer')
  @Roles(UserRole.ADMIN)
  assignDesigner(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: AssignDesignerDto,
    @CurrentUser() user: User,
  ) {
    return this.clientsService.assignDesigner(id, dto, user.id);
  }

  @Get(':id/designer')
  @Roles(UserRole.ADMIN, UserRole.DESIGN)
  getDesigner(@Param('id', UuidValidationPipe) id: string) {
    return this.clientsService.getDesigner(id);
  }
}
