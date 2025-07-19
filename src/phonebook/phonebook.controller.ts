import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Render,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PhonebookService } from './phonebook.service';
import { Response } from 'express';
import { CreateContactDto } from './dto/create-contact.dto';
import { DeleteContactDto } from './dto/delete-contact.dto';
import { UpdateContactDto } from './dto/UpdateContactDto';
import { Contact } from './contact.entity';
import { User } from './user.entity';

type ContactWithUser = Contact & { user?: User };

@Controller('phonebook')
export class PhonebookController {
  constructor(private readonly phonebookService: PhonebookService) {}

  // نمایش نتایج جستجو در صفحه اصلی
  @Get('search')
  @Render('index')
  async getIndex(@Query('q') query?: string) {
    let contacts: ContactWithUser[];

    if (!query || query.trim() === '') {
      contacts = await this.phonebookService.findAll();
    } else {
      contacts = await this.phonebookService.search(query);
      if (contacts.length === 0) {
        return { noResults: true, query };
      }
    }

    const viewContacts = contacts.map((contact) => ({
      ...contact,
      name: contact.user?.name || 'Unknown',
    }));

    return { contacts: viewContacts, query };
  }

  // جستجوی JSON
  @Get('search-json')
  async getSearchResults(@Query('q') query?: string) {
    const results = await this.phonebookService.search(query || '');
    return results;
  }

  // نمایش همه مخاطبین
  @Get()
  @Render('index')
  async findAll() {
    const contacts = await this.phonebookService.findAll();
    const viewContacts = contacts.map((contact) => ({
      ...contact,
      name: contact.user?.name || 'Unknown',
    }));

    return { contacts: viewContacts };
  }

  // گرفتن یک مخاطب خاص
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.phonebookService.findOne(+id);
    } catch (error: any) {
      console.log('خطا:', error);
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }
  }

  // افزودن مخاطب
  @Post()
  async addContact(
    @Body() createContactDto: CreateContactDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const newContact = await this.phonebookService.create(createContactDto);
      const contacts = await this.phonebookService.findAll();
      const viewContacts = contacts.map((contact) => ({
        ...contact,
        name: contact.user?.name || 'Unknown',
      }));

      res.render('index', {
        contacts: viewContacts,
        successMessage: 'مخاطب با موفقیت اضافه شد ✅',
        newContact,
      });
    } catch (error: unknown) {
      const contacts = await this.phonebookService.findAll();
      const viewContacts = contacts.map((contact) => ({
        ...contact,
        name: contact.user?.name || 'Unknown',
      }));

      let errorMessage = 'خطای ناشناخته در ثبت مخاطب';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.status(HttpStatus.BAD_REQUEST).render('index', {
        contacts: viewContacts,
        errorMessage,
      });
    }
  }

  // حذف مخاطب با POST
  @Post('delete')
  async deleteContact(
    @Body() deleteContactDto: DeleteContactDto,
    @Query('q') query: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.phonebookService.delete(+deleteContactDto.id);
      if (query) {
        const remainingResults = await this.phonebookService.search(query);
        if (remainingResults.length > 0) {
          res.redirect(`/phonebook/search?q=${encodeURIComponent(query)}`);
        } else {
          console.log('NNNNNNN', query);
          res.redirect('/phonebook');
        }
      } else {
        res.redirect('/phonebook');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(HttpStatus.NOT_FOUND).send({ message });
    }
  }

  // حذف مخاطب با DELETE
  @Delete(':id')
  async delete(@Param('id') @Res() res: Response, id: number): Promise<void> {
    try {
      await this.phonebookService.delete(+id);
      res.redirect('/phonebook');
    } catch (error: any) {
      console.log('خطا:', error);
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }
  }

  // به‌روزرسانی مخاطب
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    try {
      return await this.phonebookService.update(+id, updateContactDto);
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error)
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      throw new HttpException('خطای به‌روزرسانی مخاطب', HttpStatus.BAD_REQUEST);
    }
  }
}
