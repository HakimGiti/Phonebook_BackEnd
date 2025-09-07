// /src/contact/contact.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
  //ConflictException,
  // BadRequestException,
  // InternalServerErrorException,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UserService } from '../user/user.service';
import { BulkUpdateContactsDto } from './dto/bulk-update-contact.dto';

@Controller('contacts')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly userService: UserService, // اضافه شد
  ) {}

  // @Get()
  // async findAll() {
  //   return this.contactService.findAll();
  // }
  @Get()
  async findAll(@Query('userId') userId?: number) {
    if (userId) {
      return this.contactService.findOne(userId);
    }
    return this.contactService.findAll();
  }

  @Get('users-with-contacts')
  async getUsersWithContacts() {
    return this.contactService.findUsersWithContacts();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    console.log('findOne_id=', id);
    return this.contactService.findOne(id);
  }

  @Get('search-phone')
  async searchPhone(@Query('phone') phone: string) {
    if (!phone) return [];
    return this.contactService.searchByPhone(phone);
  }

  @Post()
  async create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateContactDto) {
    return this.contactService.update(id, dto);
  }

  @Post('bulk')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async bulkUpdate(@Body() dtoss: BulkUpdateContactsDto) {
    return this.contactService.bulkUpdate(dtoss);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.contactService.remove(id);
    return { message: 'Contact deleted successfully' };
  }
}
