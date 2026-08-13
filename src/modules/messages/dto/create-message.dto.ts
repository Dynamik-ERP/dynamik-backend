import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../../../entities/enums.js';

export class CreateMessageDto {
  @IsOptional()
  @IsEnum(MessageType)
  message_type?: MessageType = MessageType.TEXT;

  @IsString()
  body: string;
}
