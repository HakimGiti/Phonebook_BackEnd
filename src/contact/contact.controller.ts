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
import { UserService } from '../user/user.service'; // اضافه شد

@Controller('contacts')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly userService: UserService, // اضافه شد
  ) {}

  @Get()
  async findAll() {
    return this.contactService.findAll();
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
    let userId = dto.userId;

    // اگر کاربر جدید بود
    if (!userId && dto.userName) {
      let user = await this.userService.findByName(dto.userName);
      if (!user) {
        user = await this.userService.create({ name: dto.userName });
      }
      userId = user.id;
    }

    // حالا Contact رو ثبت کن
    return this.contactService.create({
      ...dto,
      userId,
    });
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
