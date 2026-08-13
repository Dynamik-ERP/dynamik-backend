import { Controller, Post, Body, Headers, HttpCode, HttpStatus, ForbiddenException, UseGuards } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../entities/user.entity.js';
import { LinkTelegramDto } from './dto/link-telegram.dto.js';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator.js';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('X-Telegram-Bot-Api-Secret-Token') secretHeader?: string,
  ) {
    const secretToken = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!secretToken) {
      throw new ForbiddenException('TELEGRAM_WEBHOOK_SECRET is not configured. Webhook processing is disabled.');
    }
    if (secretHeader !== secretToken) {
      throw new ForbiddenException('Invalid webhook secret token');
    }

    if (body.message?.text?.startsWith('/start') && body.message?.chat) {
      const chatId = body.message.chat.id.toString();
      const username = body.message.from?.username;
      const reply = await this.telegramService.handleStartCommand(chatId, username);
      await this.telegramService.sendRelayMessage(chatId, reply);
      return { status: 'ok' };
    }

    if (body.message?.chat && body.message?.contact) {
      const chat = body.message.chat;
      const contact = body.message.contact;
      await this.telegramService.handleContactShare(
        chat.id.toString(),
        contact.phone_number,
        contact.first_name,
      );
    }

    return { status: 'ok' };
  }

  @Post('link')
  @UseGuards(JwtAuthGuard)
  async linkStaff(
    @CurrentUser() user: User,
    @Body() dto: LinkTelegramDto,
  ) {
    return this.telegramService.linkStaff(user.id, dto.telegram_chat_id);
  }
}
