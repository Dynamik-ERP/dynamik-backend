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
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.])[A-Za-z\d@$!%*?&#+\-_.]{12,}$/, {
    message: 'Password must include uppercase, lowercase, digit, and special character',
  })
  password: string;
}
