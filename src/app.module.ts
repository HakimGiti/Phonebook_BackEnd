import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhonebookModule } from './phonebook/phonebook.module';
import { Contact } from './phonebook/contact.entity';
import { User } from './phonebook/user.entity'; // ✅ این رو اضافه کن

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'phonebook.sqlite',
      entities: [Contact, User], // اضافه کردن هر دو Entity
      synchronize: true, // فقط در توسعه فعال باشه
    }),

    PhonebookModule,
  ],
  //controllers: [PhonebookController], //[AppController],
  //providers: [PhonebookService], //[AppService],
})
export class AppModule {}
