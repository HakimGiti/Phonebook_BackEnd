// src/phonebook/phonebook.module.ts
import { Module } from '@nestjs/common';
import { PhonebookController } from './phonebook.controller';
import { PhonebookService } from './phonebook.service';
import { UserModule } from '../user/user.module';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [UserModule, ContactModule],
  controllers: [PhonebookController],
  providers: [PhonebookService],
  exports: [PhonebookService],
})
export class PhonebookModule {}
