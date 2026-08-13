import { IsString, IsEnum, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { InventoryCategory } from '../../../entities/enums.js';

export class CreateInventoryItemDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity?: number;
}
