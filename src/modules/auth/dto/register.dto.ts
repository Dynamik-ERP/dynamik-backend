import { IsNotEmpty, IsString, MinLength, IsEmail, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  registration_code: string;

  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters' })
  password: string;
}
