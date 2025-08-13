import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './contact.entity';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module'; // ✅ اضافه شد

@Module({
  imports: [TypeOrmModule.forFeature([Contact, User]), UserModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService], // خیلی مهم برای دسترسی از ماژول‌های دیگه
})
export class ContactModule {}
