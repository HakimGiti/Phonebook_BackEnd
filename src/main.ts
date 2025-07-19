// ---------------------------------------------- original
//import { NestFactory } from '@nestjs/core';
//import { AppModule } from './app.module';
//
//async function bootstrap() {
//  const app = await NestFactory.create(AppModule);
//  await app.listen(process.env.PORT ?? 3000);
//}
//bootstrap();
//
//
//
//
//
// ----------------------------------------------- nestjs website Doc
//import { NestFactory } from '@nestjs/core';
//import { NestExpressApplication } from '@nestjs/platform-express';
//import { join } from 'path';
//import { AppModule } from './app.module';
//
//async function bootstrap() {
//  const app = await NestFactory.create<NestExpressApplication>(AppModule);
//
//  app.useStaticAssets(join(__dirname, '..', 'public'));
//  app.setBaseViewsDir(join(__dirname, '..', 'views'));
//  app.setViewEngine('hbs');
//
//  await app.listen(process.env.PORT ?? 3000);
//}
//bootstrap();
//
//
//
//
//
// ----------------------------------------------- ChatGPT
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as hbs from 'hbs';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // تنظیمات اعتبارسنجی
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ⬅️ مهم: فقط فیلدهای تعریف‌ شده در «دی تی او» را رو قبول می‌کنه
      forbidNonWhitelisted: true, // ⬅️ اگر فیلدی اضافه بود، پیغام خطا می‌ده
      transform: true,
    }),
  );
  // تنظیمات ویوها
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  (hbs as any).registerHelper('addOne', function (index: number) {
    return index + 1; // برای تعریف تعداد نتایج جستجو
  });

  await app.listen(3000);
}
bootstrap();
