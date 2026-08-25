import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../entities/user.entity.js';
import { Order } from '../../entities/order.entity.js';
import { Message } from '../../entities/message.entity.js';
import { UserRole, OrderStatus, MessageChannel, MessageType } from '../../entities/enums.js';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private isMocked = true;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly eventEmitter: EventEmitter2,
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

  // ─── Admin & Staff Notification Relay ───────────────────────────────
  async notifyStaff(message: string, roles: UserRole[] = [UserRole.ADMIN]): Promise<void> {
    try {
      const staffUsers = await this.userRepo.find({
        where: roles.map(role => ({ role, telegram_chat_id: undefined })),
      });
      // Filter to only users who actually have a telegram_chat_id
      const linkedStaff = staffUsers.filter(u => u.telegram_chat_id);
      if (linkedStaff.length === 0) {
        this.logger.log(`No staff with linked Telegram found for roles [${roles.join(', ')}]. Skipping notification.`);
        return;
      }
      for (const staff of linkedStaff) {
        await this.sendRelayMessage(staff.telegram_chat_id!, message);
      }
      this.logger.log(`Notified ${linkedStaff.length} staff member(s) via Telegram.`);
    } catch (err: any) {
      this.logger.error(`Failed to notify staff: ${err.message}`);
    }
  }

  async notifyAdmins(message: string): Promise<void> {
    // Query admins directly with a proper where clause
    const admins = await this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ADMIN })
      .andWhere('user.telegram_chat_id IS NOT NULL')
      .getMany();

    for (const admin of admins) {
      await this.sendRelayMessage(admin.telegram_chat_id!, message);
    }
    if (admins.length > 0) {
      this.logger.log(`Notified ${admins.length} admin(s) via Telegram.`);
    }
  }

  async handleStartCommand(chatId: string, username?: string, deepLinkParam?: string): Promise<string> {
    const existingUser = await this.userRepo.findOne({ where: { telegram_chat_id: chatId } });

    // If this is an admin/staff starting the bot, greet them differently
    if (existingUser && existingUser.role !== UserRole.CLIENT) {
      const staffWelcome = `👋 Welcome, ${existingUser.full_name}!\n\n🔧 Role: ${existingUser.role.toUpperCase()}\n\nYou are now connected to Dynamik ERP notifications. You will receive real-time alerts here when:\n• New clients register\n• Clients send messages\n• Orders are updated`;
      await this.sendMessageWithKeyboard(chatId, staffWelcome, { remove_keyboard: true });
      return staffWelcome;
    }

    // Deep link: /start link_admin — auto-link the admin account
    if (deepLinkParam === 'link_admin') {
      const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
      if (admin) {
        // Clear any existing collision first
        await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ telegram_chat_id: null })
          .where('telegram_chat_id = :chatId AND id != :adminId', { chatId, adminId: admin.id })
          .execute();

        admin.telegram_chat_id = chatId;
        await this.userRepo.save(admin);
        const msg = `✅ Admin account linked!\n\n👤 ${admin.full_name}\n📧 ${admin.email}\n🔧 Role: ADMIN\n\nYou will now receive real-time Telegram notifications for:\n• New client registrations\n• Incoming client messages\n• Order updates`;
        try {
          await this.sendMessageWithKeyboard(chatId, msg, { remove_keyboard: true });
        } catch (e) {
          this.logger.warn(`Could not send welcome to ${chatId}: ${e.message}`);
        }
        return msg;
      }
    }

    if (existingUser && existingUser.phone) {
      const welcomeBack = `👋 Welcome back to Dynamik ERP, ${existingUser.full_name}!\n\nYou are connected to our production & design workspace. Type any message or request here to chat directly with your assigned designer and engineering team.`;
      await this.sendMessageWithKeyboard(chatId, welcomeBack, { remove_keyboard: true });
      return welcomeBack;
    }

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

    // Clear any collision on telegram_chat_id from other rows (e.g. temp client rows)
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ telegram_chat_id: null })
      .where('telegram_chat_id = :chatId AND id != :userId', { chatId: telegramChatId, userId })
      .execute();

    user.telegram_chat_id = telegramChatId;
    const saved = await this.userRepo.save(user);

    try {
      await this.sendMessageWithKeyboard(
        telegramChatId,
        `✅ Your Telegram account has been linked to Dynamik ERP staff profile: ${user.full_name} (${user.role.toUpperCase()}). You will now receive live alerts here.`,
        { remove_keyboard: true },
      );
    } catch (err: any) {
      this.logger.warn(`Could not send Telegram message to ${telegramChatId}: ${err.message}`);
    }

    return saved;
  }

  async handleContactShare(chatId: string, phone: string, firstName: string): Promise<User> {
    let user = await this.userRepo.findOne({ where: { telegram_chat_id: chatId } });
    let isNewRegistration = false;
    if (!user) {
      user = await this.userRepo.findOne({ where: { phone } });
      if (user) {
        user.telegram_chat_id = chatId;
        await this.userRepo.save(user);
      } else {
        isNewRegistration = true;
        user = this.userRepo.create({
          full_name: firstName || 'Telegram Client',
          phone,
          role: UserRole.CLIENT,
          telegram_chat_id: chatId,
        });
        await this.userRepo.save(user);
        this.logger.log(`Created new client user from Telegram: ${firstName} (${phone})`);
      }
    }

    // Ensure an active order exists for this client so messages appear in admin/designer order queues
    let activeOrder = await this.orderRepo.findOne({
      where: { client_id: user.id },
      order: { created_at: 'DESC' },
    });
    if (!activeOrder) {
      activeOrder = this.orderRepo.create({
        client_id: user.id,
        status: OrderStatus.DRAFT,
      });
      await this.orderRepo.save(activeOrder);
      this.eventEmitter.emit('order.created', { orderId: activeOrder.id });
    }

    const message = `✅ Thank you, ${firstName}! Your account has been registered with Dynamik ERP.\n\n💬 You can now send any questions, measurements, or design requirements directly in this chat!`;
    await this.sendMessageWithKeyboard(chatId, message, { remove_keyboard: true });

    // 🔔 Notify all admins about new client registration
    const adminNotification = isNewRegistration
      ? `🆕 New Client Registration\n\n👤 Name: ${firstName}\n📱 Phone: ${phone}\n🆔 ID: ${user.id}\n📋 Order: ${activeOrder.id}`
      : `🔗 Returning Client Linked\n\n👤 Name: ${user.full_name}\n📱 Phone: ${phone}`;
    await this.notifyAdmins(adminNotification);

    return user;
  }

  async handleIncomingMessage(chatId: string, text: string, telegramMessageId?: string): Promise<void> {
    let user = await this.userRepo.findOne({ where: { telegram_chat_id: chatId } });
    if (!user) {
      await this.handleStartCommand(chatId);
      return;
    }

    // If this is a staff/admin user messaging, don't create client orders — just acknowledge
    if (user.role !== UserRole.CLIENT) {
      this.logger.log(`Staff message from ${user.full_name} (${user.role}): ${text}`);
      return;
    }

    // Find or create active draft order for client
    let order = await this.orderRepo.findOne({
      where: { client_id: user.id },
      order: { created_at: 'DESC' },
    });
    if (!order) {
      order = this.orderRepo.create({
        client_id: user.id,
        status: OrderStatus.DRAFT,
      });
      order = await this.orderRepo.save(order);
      this.eventEmitter.emit('order.created', { orderId: order.id });
    }

    // Save message to database
    const savedMessage = this.messageRepo.create({
      order_id: order.id,
      sender_id: user.id,
      channel: MessageChannel.TELEGRAM,
      message_type: MessageType.TEXT,
      body: text,
      telegram_message_id: telegramMessageId ? String(telegramMessageId) : null,
    });
    await this.messageRepo.save(savedMessage);

    // Emit event so web dashboards (Admin / Designer / Operations) receive it live
    this.eventEmitter.emit('message.created', {
      orderId: order.id,
      messageId: savedMessage.id,
      senderId: user.id,
      body: text,
    });

    this.logger.log(`Telegram message from ${user.full_name} (${chatId}) saved to Order ${order.id}`);

    // 🔔 Notify admins about the incoming client message
    await this.notifyAdmins(
      `💬 New message from client\n\n👤 ${user.full_name} (${user.phone || 'no phone'})\n📋 Order: ${order.id}\n\n"${text.length > 200 ? text.substring(0, 200) + '...' : text}"`,
    );
  }
}
