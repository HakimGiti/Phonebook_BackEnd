import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhonebookController } from './phonebook.controller';
import { PhonebookService } from './phonebook.service';
import { Contact } from './contact.entity';
import { User } from './user.entity';
//import { UserModule } from './user.module';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, User]),
    // UserModule
  ],
  controllers: [PhonebookController],
  providers: [PhonebookService, UserService],
})
export class PhonebookModule {}
