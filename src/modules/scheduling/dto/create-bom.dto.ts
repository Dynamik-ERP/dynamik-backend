import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateBomDto {
  @IsUUID()
  order_id: string;

  @IsOptional()
  @IsObject()
  boards?: Record<string, any>;

  @IsOptional()
  @IsObject()
  colors?: Record<string, any>;

  @IsOptional()
  @IsObject()
  accessories?: Record<string, any>;

  @IsOptional()
  @IsObject()
  edging?: Record<string, any>;
}
