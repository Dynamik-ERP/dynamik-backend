import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../entities/enums.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class FilterOrdersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @IsUUID()
  designer_id?: string;
}
