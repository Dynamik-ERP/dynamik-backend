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

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set. Running in MOCK mode.');
      this.isMocked = true;
    } else {
      this.isMocked = false;
      this.logger.log('Telegram Bot Token loaded.');
    }
  }

  async sendRelayMessage(chatId: string, message: string): Promise<boolean> {
    if (this.isMocked) {
      this.logger.log(`[MOCK TELEGRAM RELAY to ${chatId}]: ${message}`);
      return true;
    }

    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Telegram relay failed: ${response.status} ${body}`);
      return false;
    }

    return true;
  }

  async handleStartCommand(chatId: string, username?: string): Promise<string> {
    return 'Welcome to Dynamik ERP Client Onboarding! Please share your contact using the menu button below.';
  }

  async linkStaff(userId: string, telegramChatId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.telegram_chat_id = telegramChatId;
    return this.userRepo.save(user);
  }

  async handleContactShare(chatId: string, phone: string, firstName: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { telegram_chat_id: chatId } });
    if (!user) {
      user = this.userRepo.create({
        full_name: firstName,
        phone,
        role: UserRole.CLIENT,
        telegram_chat_id: chatId,
      });
      await this.userRepo.save(user);
      this.logger.log(`Created new client user from Telegram: ${firstName} (${phone})`);
    }
    return user;
  }
}
