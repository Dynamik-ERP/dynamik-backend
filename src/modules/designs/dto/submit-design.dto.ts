import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitDesignDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  file_url?: string;
}
