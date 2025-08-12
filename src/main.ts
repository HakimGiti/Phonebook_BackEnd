import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
//import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // فعال‌سازی CORS برای اتصال فرانت
  app.enableCors({
    origin: 'http://localhost:3001', // آدرس فرانت (پورت Next.js)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // فعال‌سازی ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
  console.log(`🚀 Application is running on: http://localhost:3000`);
}
bootstrap();
