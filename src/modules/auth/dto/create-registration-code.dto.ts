import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../../entities/enums.js';

export class CreateRegistrationCodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
