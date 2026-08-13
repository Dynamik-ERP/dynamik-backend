import { IsEnum, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { TransactionType } from '../../../entities/enums.js';

export class CreateMaterialTransactionDto {
  @IsUUID()
  item_id: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsUUID()
  design_id?: string;
}
