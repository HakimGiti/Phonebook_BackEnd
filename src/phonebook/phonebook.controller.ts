// src/phonebook/phonebook.controller.ts
import { Controller, Get, Delete, Param } from '@nestjs/common';
import { PhonebookService } from './phonebook.service';

@Controller('phonebook')
export class PhonebookController {
  constructor(private readonly phonebookService: PhonebookService) {}

  @Get()
  async showPhonebook() {
    const users = await this.phonebookService.getPhonebook();
    return { users };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.phonebookService.remove(+id);
    return { message: 'Deleted successfully' };
  }
}
