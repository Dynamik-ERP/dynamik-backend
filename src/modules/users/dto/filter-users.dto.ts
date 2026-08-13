import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { UserRole } from '../../../entities/enums.js';

export class FilterUsersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
