import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts') // بهتره جمع باشه برای API
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async findAll() {
    return this.contactService.findAll(); // خروجی JSON
  }

  @Get('users-with-contacts')
  async getUsersWithContacts() {
    return this.contactService.findUsersWithContacts();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.contactService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateContactDto) {
    return this.contactService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.contactService.remove(id);
    return { message: 'Contact deleted successfully' };
  }
}
