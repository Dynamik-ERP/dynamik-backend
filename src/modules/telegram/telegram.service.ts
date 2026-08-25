import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../entities/enums.js';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private isMocked = true;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set. Running in MOCK mode.');
      this.isMocked = true;
    } else {
      this.isMocked = false;
      this.logger.log('Telegram Bot Token loaded.');
      await this.setupWebhook();
    }
  }

  async setupWebhook(webhookUrl?: string): Promise<any> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Skipping webhook registration.');
      return { success: false, message: 'TELEGRAM_BOT_TOKEN not configured' };
    }

    const baseUrl =
      webhookUrl ||
      this.configService.get<string>('BACKEND_URL') ||
      this.configService.get<string>('RENDER_EXTERNAL_URL') ||
      'https://dynamik-backend.onrender.com';

    const cleanBase = baseUrl.trim().replace(/\/+$/, '');
    const finalUrl = `${cleanBase}/api/v1/telegram/webhook`;
    const secretToken = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    const payload: any = { url: finalUrl };
    if (secretToken) {
      payload.secret_token = secretToken;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      this.logger.log(`Telegram setWebhook response for ${finalUrl}: ${JSON.stringify(data)}`);
      return data;
    } catch (err: any) {
      this.logger.error(`Failed to register Telegram webhook: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendRelayMessage(chatId: string, message: string): Promise<boolean> {
    return this.sendMessageWithKeyboard(chatId, message);
  }

  async sendMessageWithKeyboard(chatId: string, message: string, replyMarkup?: any): Promise<boolean> {
    if (this.isMocked) {
      this.logger.log(`[MOCK TELEGRAM RELAY to ${chatId}]: ${message}`);
      return true;
    }

    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const body: any = {
      chat_id: chatId,
      text: message,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const respBody = await response.text();
      this.logger.error(`Telegram relay failed: ${response.status} ${respBody}`);
      return false;
    }

    return true;
  }

  async handleStartCommand(chatId: string, username?: string): Promise<string> {
    const text = `👋 Welcome to Dynamik ERP!\n\nPlease share your contact details using the button below to register or link your manufacturing account.`;
    const replyMarkup = {
      keyboard: [
        [
          {
            text: '📱 Share Contact Number',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
    await this.sendMessageWithKeyboard(chatId, text, replyMarkup);
    return text;
  }

  async linkStaff(userId: string, telegramChatId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.telegram_chat_id = telegramChatId;
    const saved = await this.userRepo.save(user);
    await this.sendRelayMessage(telegramChatId, `✅ Your Telegram account has been linked to Dynamik ERP staff profile: ${user.full_name}.`);
    return saved;
  }

  async handleContactShare(chatId: string, phone: string, firstName: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { telegram_chat_id: chatId } });
    if (!user) {
      user = await this.userRepo.findOne({ where: { phone } });
      if (user) {
        user.telegram_chat_id = chatId;
        await this.userRepo.save(user);
        await this.sendRelayMessage(chatId, `✅ Welcome back, ${user.full_name}! Your Telegram account has been linked to your client profile.`);
        return user;
      }
      user = this.userRepo.create({
        full_name: firstName || 'Telegram Client',
        phone,
        role: UserRole.CLIENT,
        telegram_chat_id: chatId,
      });
      await this.userRepo.save(user);
      this.logger.log(`Created new client user from Telegram: ${firstName} (${phone})`);
    }
    await this.sendRelayMessage(chatId, `✅ Thank you, ${firstName}! Your account has been registered with Dynamik ERP.`);
    return user;
  }
}
