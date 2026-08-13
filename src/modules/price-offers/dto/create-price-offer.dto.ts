import { IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePriceOfferDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;
}
