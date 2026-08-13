import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe.js';
import { UserRole } from '../../entities/enums.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { InvoicingService } from './invoicing.service.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicingService.create(dto);
  }

  @Get()
  findAll() {
    return this.invoicingService.findAll();
  }

  @Post(':id/issue')
  issue(@Param('id', UuidValidationPipe) id: string) {
    return this.invoicingService.issue(id);
  }

  @Post(':id/mark-paid')
  markPaid(@Param('id', UuidValidationPipe) id: string) {
    return this.invoicingService.markPaid(id);
  }
}
