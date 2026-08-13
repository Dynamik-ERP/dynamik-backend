import { IsNotEmpty, IsString } from 'class-validator';

export class LinkTelegramDto {
  @IsString()
  @IsNotEmpty({ message: 'telegram_chat_id is required' })
  telegram_chat_id: string;
}
