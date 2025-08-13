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
