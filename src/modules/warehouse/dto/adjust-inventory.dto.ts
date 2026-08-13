import { IsNumber } from 'class-validator';

export class AdjustInventoryDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity: number;
}
