import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm'; //, Like
import { Contact } from './contact.entity';
import { PrimeryDataDto } from './dto/primeryData.dto';
import { UserService } from './user.service';
import { concat } from 'rxjs';
import { User } from './user.entity';

@Injectable()
export class PhonebookService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,

    private readonly userService: UserService, // 👈 تزریق UserService ------------------
  ) {}

  async findAll(): Promise<Contact[]> {
    return await this.contactRepository.find({
      relations: ['user'], //-------------------
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: ['user'], // 👈 برای نمایش نام ---------------------------
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(primeryData: PrimeryDataDto): Promise<Contact> {
    // اعتبارسنجی شماره تلفن
    if (Array.isArray(primeryData.phone)) {
      throw new BadRequestException('فقط یک شماره تلفن مجاز است');
    }

    if (!primeryData.phone || primeryData.phone.trim() === '') {
      throw new BadRequestException('شماره تلفن نمی‌تواند خالی باشد');
    }

    if (!/^\d{10,15}$/.test(primeryData.phone)) {
      throw new BadRequestException(
        'شماره تلفن باید فقط شامل ارقام باشد (۱۰ تا ۱۵ رقم)',
      );
    }

    // بررسی تکراری بودن شماره تلفن
    const duplicatePhone = await this.contactRepository.findOne({
      where: { phone: primeryData.phone },
    });

    if (duplicatePhone) {
      throw new BadRequestException('شماره تلفن تکراری است');
    }

    // ---------------------------------------- پاس دادن متغیر «نام» به یوزر سرویس
    // 🧠 پیدا کردن یا ساختن یوزر براساس نام
    let user = await this.userService.findByName(primeryData.name);
    if (!user) {
      user = await this.userService.create({ name: primeryData.name });
    }

    // بررسی تکراری بودن کامل مخاطب @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    const exactDuplicate = await this.contactRepository.findOne({
      where: {
        phone: primeryData.phone,
        email: primeryData.email,
        user: { id: user.id }, // اضافه شد
      },
      relations: ['user'], //یوزر را شرط گذاشتیم
    });
    if (exactDuplicate) {
      throw new BadRequestException('مخاطب قبلاً ثبت شده است');
    } //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

    // ایجاد مخاطب
    const newContact = this.contactRepository.create({
      phone: primeryData.phone,
      email: primeryData.email,
      user: user,
    });
    return await this.contactRepository.save(newContact);
  }

  async update(id: number, updatedData: Partial<Contact>): Promise<Contact> {
    const contact = await this.findOne(id);

    if (updatedData.phone) {
      if (!/^\d{10,15}$/.test(updatedData.phone)) {
        throw new BadRequestException(
          'شماره تلفن باید فقط شامل ارقام باشد (۱۰ تا ۱۵ رقم)',
        );
      }

      const duplicatePhone = await this.contactRepository.findOne({
        where: { phone: updatedData.phone },
      });

      if (duplicatePhone && duplicatePhone.id !== id) {
        throw new BadRequestException('شماره تلفن تکراری است');
      }
    }

    Object.assign(contact, updatedData);
    return await this.contactRepository.save(contact);
  }

  async delete(id: number): Promise<void> {
    const result = await this.contactRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Contact not found');
    }
  }

  async search(query: string): Promise<Contact[]> {
    //--------------------------------------------------- 1
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await this.contactRepository.find({
      where: [
        { phone: Like(lowerQuery) },
        { email: Like(lowerQuery) },
        //{ email: Like(lowerQuery) }, // توجه: چون name داخل user هست، اینجا باید بازنویسی بشه اگر بخوای name هم سرچ کنی
        { user: { name: Like(lowerQuery) } }, // 🔍 اضافه کردن جستجو روی user.nam
      ],
      relations: ['user'], // 👈 برای دسترسی به user.name در خروجی
    });
    //--------------------------------------------------- 3
    // return await this.contactRepository.find({
    //   where: [
    //     { name: Like(`%${query}%`) },
    //     { phone: Like(`%${query}%`) },
    //     //{ email: Like(`%${query}%`) }, // توجه: چون name داخل user هست، اینجا باید بازنویسی بشه اگر بخوای name هم سرچ کنی
    //   ],
    //   relations: ['user'], // ⬅️ اینجا هم باید اضافه بشه
    // });

    //--------------------------------------------------- 2
    // const lowerQuery = `%${query.toLowerCase()}%`;
    // return await this.contactRepository
    //   .createQueryBuilder('contact')
    //   .leftJoinAndSelect('contact.user', 'user')
    //   .where('contact.phone LIKE :query', { query: lowerQuery })
    //   .orWhere('contact.email LIKE :query', { query: lowerQuery })
    //   .orWhere('LOWER(user.name) LIKE :query', { query: lowerQuery })
    //   .getMany();

    //--------------------------------------------------- 5
    // const lowerQuery = `%${query.toLowerCase()}%`;
    // return await this.contactRepository
    //   .createQueryBuilder('contact')
    //   .leftJoinAndSelect('contact.user', 'user')
    //   .where('LOWER(contact.phone) LIKE :query', { query: lowerQuery })
    //   .orWhere('LOWER(contact.email) LIKE :query', { query: lowerQuery })
    //   .orWhere('LOWER(user.name) LIKE :query', { query: lowerQuery }) // 👈 جستجو در نام کاربر
    //   .getMany();

    //--------------------------------------------------- 4
    // return this.contactRepository
    //   .createQueryBuilder('contact')
    //   .leftJoinAndSelect('contact.user', 'user')
    //   .where('contact.phone LIKE :query', { query: `%${query}%` })
    //   .orWhere('user.name LIKE :query', { query: `%${query}%` })
    //   .getMany();
  }
}
