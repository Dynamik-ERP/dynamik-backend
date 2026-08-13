import { IsArray, ValidateNested, IsUUID, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcurementItemDto {
  @IsUUID()
  item_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity: number;
}

export class CreateProcurementRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcurementItemDto)
  items: ProcurementItemDto[];
}
