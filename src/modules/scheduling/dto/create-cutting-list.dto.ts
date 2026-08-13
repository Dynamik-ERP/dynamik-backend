import { IsUUID } from 'class-validator';

export class CreateCuttingListDto {
  @IsUUID()
  order_id: string;
}
