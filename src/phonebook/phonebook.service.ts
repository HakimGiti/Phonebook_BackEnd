// src/phonebook/phonebook.service.ts
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ContactService } from '../contact/contact.service';

@Injectable()
export class PhonebookService {
  constructor(
    private readonly userService: UserService,
    private readonly contactService: ContactService,
  ) {}

  //------------------------------------------------------------
  async getPhonebook(): Promise<
    { id: number; name: string; phone: string | null }[]
  > {
    // const users = await this.userService.findAll(); // users با contacts
    // // همه کانتکت‌ها را جدا می‌کنیم و همراه با نام یوزر به یک آرایه flat تبدیل می‌کنیم
    // const phonebook = users.flatMap((user) =>
    //   user.contacts.map((contact) => ({
    //     id: contact.id,
    //     name: user.name,
    //     phone: contact.phone,
    //   })),
    // );
    // //  فیلتر : فقط کانتکت‌هایی که شماره دارند
    // return phonebook.filter(
    //   (entry) => entry.phone !== null && entry.phone !== '',
    // );

    const contacts = await this.contactService.findAllWithUsers();
    const phonebook = contacts
      .filter((contact) => contact.phone !== null && contact.phone !== '')
      .map((contact) => ({
        id: contact.id,
        name: contact.user.name,
        phone: contact.phone,
      }));

    return phonebook;
  } //------------------------------------------------------------

  async remove(contactId: number) {
    return this.contactService.remove(contactId);
  }
}
