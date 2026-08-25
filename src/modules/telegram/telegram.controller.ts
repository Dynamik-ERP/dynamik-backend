import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, ForbiddenException, UseGuards } from '@nestjs/common';
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

  @Get('setup-webhook')
  @SkipCsrf()
  getSetupWebhook() {
    return this.telegramService.setupWebhook();
  }

  @Post('setup-webhook')
  @SkipCsrf()
  postSetupWebhook() {
    return this.telegramService.setupWebhook();
  }

  @Post('webhook')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('X-Telegram-Bot-Api-Secret-Token') secretHeader?: string,
  ) {
    const secretToken = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (secretToken && secretHeader !== secretToken) {
      throw new ForbiddenException('Invalid webhook secret token');
    }

    if (body.message?.text?.startsWith('/start') && body.message?.chat) {
      const chatId = body.message.chat.id.toString();
      const username = body.message.from?.username;
      // Extract deep-link parameter: "/start link_admin" → "link_admin"
      const parts = body.message.text.trim().split(/\s+/);
      const deepLinkParam = parts.length > 1 ? parts[1] : undefined;
      await this.telegramService.handleStartCommand(chatId, username, deepLinkParam);
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
      return { status: 'ok' };
    }

    if (body.message?.text && body.message?.chat) {
      const chatId = body.message.chat.id.toString();
      await this.telegramService.handleIncomingMessage(
        chatId,
        body.message.text,
        body.message.message_id,
      );
      return { status: 'ok' };
    }

    if (body.callback_query) {
      await this.telegramService.handleCallbackQuery(body.callback_query);
      return { status: 'ok' };
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
