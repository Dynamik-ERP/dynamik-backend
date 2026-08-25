import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { seedAdmin } from './database/seeds/admin-seed.js';

function parseCorsOrigins(value?: string): string[] | string {
  if (!value || value === '*') {
    return ['http://localhost:3000', 'http://localhost:3002'];
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      const configured = configService.get<string>('CORS_ORIGIN');
      if (
        !configured ||
        configured === '*' ||
        configured.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dynamik ERP API')
    .setDescription('Production ERP API for Dyna-Mik furniture manufacturing')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  if (configService.get('SEED_ADMIN') === 'true') {
    const dataSource = app.get(DataSource);
    await seedAdmin(dataSource);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Dynamik ERP running on port ${port} (API Prefix: /api/v1)`);
}
bootstrap();
