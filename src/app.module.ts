import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CsrfGuard } from './common/guards/csrf.guard.js';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor.js';
import { validateEnv } from './config/validate-env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TelegramModule } from './modules/telegram/telegram.module.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PriceOffersModule } from './modules/price-offers/price-offers.module.js';
import { DesignsModule } from './modules/designs/designs.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { SchedulingModule } from './modules/scheduling/scheduling.module.js';
import { WarehouseModule } from './modules/warehouse/warehouse.module.js';
import { ShopFloorModule } from './modules/shop-floor/shop-floor.module.js';
import { QcModule } from './modules/qc/qc.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { VendorsModule } from './modules/vendors/vendors.module.js';
import { InvoicingModule } from './modules/invoicing/invoicing.module.js';
import { ExportModule } from './modules/export/export.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    HealthModule,
    AuthModule,
    TelegramModule,
    ClientsModule,
    OrdersModule,
    PriceOffersModule,
    DesignsModule,
    MessagesModule,
    SchedulingModule,
    WarehouseModule,
    ShopFloorModule,
    QcModule,
    NotificationsModule,
    StorageModule,
    UsersModule,
    AuditModule,
    ReportsModule,
    VendorsModule,
    InvoicingModule,
    ExportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
  ],
})
export class AppModule {}
