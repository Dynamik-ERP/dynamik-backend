import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { QcResult } from '../../../entities/enums.js';

export class CreateQcCheckDto {
  @IsUUID()
  order_id: string;

  @IsString()
  @MaxLength(40)
  station: string;

  @IsEnum(QcResult)
  result: QcResult;

  @IsOptional()
  @IsString()
  notes?: string;
}
