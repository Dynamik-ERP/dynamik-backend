import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  order_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax_rate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}
