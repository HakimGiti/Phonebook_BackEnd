import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ContactModule } from './contact/contact.module';
import { PhonebookModule } from './phonebook/phonebook.module';
import { User } from './user/user.entity';
import { Contact } from './contact/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost', // یا IP سرور
      port: 3306,
      username: 'root', // یوزر phpMyAdmin
      password: '', // رمز phpMyAdmin
      database: 'phonebook_db', // نام دیتابیس در phpMyAdmin
      entities: [User, Contact],
      synchronize: true, // فقط در حالت توسعه (Development) // در حالت پروداکشن خاموش کنید (Production)
    }),
    UserModule,
    ContactModule,
    PhonebookModule,
  ],
})
export class AppModule {}
