import { IsUUID } from 'class-validator';

export class AssignDesignerDto {
  @IsUUID()
  designer_id: string;
}
