import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { text } from 'express';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './support/redis-io.adapter';

async function bootstrap() {
  // rawBody: true — сохраняет сырое тело запроса (нужно для проверки HMAC-подписи вебхуков WHOOP).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Алкотестер Alcostop 8000S шлёт SOAP (text/xml) с фото (base64) — тело до сотен КБ.
  // Разбираем text/xml в строку с увеличенным лимитом (дефолтные 100 КБ малы).
  app.use(text({ type: ['text/xml', 'application/xml', 'application/soap+xml'], limit: '15mb' }));

  app.enableCors({ origin: true, credentials: true });

  // Socket.IO с Redis-адаптером (мультиреплика). Без Redis — in-memory fallback.
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connect(process.env.REDIS_URL ?? 'redis://localhost:6379');
  app.useWebSocketAdapter(redisAdapter);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('SOS24 API')
    .setDescription('Бэкенд платформы SOS24 — авто-страхование Узбекистана')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api-docs', app, document);

  const port = Number(process.env.PORT ?? 3030);
  await app.listen(port);
  console.log(`[sos24-api] listening on http://localhost:${port}`);
  console.log(`[sos24-api] swagger: http://localhost:${port}/api-docs`);
}
bootstrap();
