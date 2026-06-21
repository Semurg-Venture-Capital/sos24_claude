import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './support/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
