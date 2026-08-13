import { IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @IsDateString()
  delivery_date: string;

  @IsDateString()
  production_start: string;

  @IsDateString()
  production_end: string;
}
