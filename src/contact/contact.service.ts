// /src/contact/contact.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { User } from '../user/user.entity';
import { Raw } from 'typeorm';
//import { BulkUpdateContactDto } from './dto/updatebulk-contact.dto';
import {
  BulkUpdateContactsDto,
  // SingleUpdateContactDto,
} from './dto/bulk-update-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  //--------------------------------------------------------------------- Find All
  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({ relations: ['user'] });
  }

  //--------------------------------------------------------------------- Find One (id)
  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  //--------------------------------------------------------------------- Find All With Users
  async findAllWithUsers(): Promise<Contact[]> {
    return this.contactRepository.find({ relations: ['user'] });
  }

  //--------------------------------------------------------------------- Create
  // ContactService.ts
  async create(dto: CreateContactDto): Promise<Contact> {
    let user: User | null = null;
    console.log('dto.userId = ', dto.userId);
    if (dto.userId !== undefined && dto.userId !== null) {
      const userIdNum = Number(dto.userId);

      if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        throw new BadRequestException('userId نامعتبر است');
      }
      dto.userId = userIdNum; // 📌 مقدار درست شده را دوباره در dto برمی‌گردونیم

      user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
    }

    // 2️⃣ بررسی شماره تکراری
    const existingContact = await this.contactRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existingContact) {
      throw new ConflictException('این شماره قبلاً ثبت شده است.');
    }

    // 3️⃣ اگر userId داده نشده، بررسی userName
    if (!user && dto.userName) {
      const name = dto.userName.trim();

      // جستجوی کاربر با حساسیت به حروف کوچک/بزرگ نادیده گرفته شود
      user = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.name) = LOWER(:name)', { name })
        .getOne();

      // اگر کاربر پیدا نشد، بسازش
      if (!user) {
        user = this.userRepository.create({
          name,
          username: undefined,
          password: undefined,
          nationalCode: undefined, // به جای null
          nationalId: undefined, // به جای null
          job: undefined, // به جای null
          gender: undefined, // به جای null
        });
        user = await this.userRepository.save(user);
      }
    }

    // 4️⃣ اگر هنوز کاربر وجود ندارد => خطا
    if (!user) {
      throw new BadRequestException('UserId یا userName الزامی است');
    }

    // 5️⃣ ایجاد و ذخیره مخاطب جدید
    try {
      const contact = this.contactRepository.create({ ...dto, user });
      return await this.contactRepository.save(contact);
    } catch (error) {
      // خطاهای پیش‌بینی‌شده را دوباره پرتاب کن
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      // بقیه خطاها => Internal Server Error
      throw new InternalServerErrorException('خطای داخلی سرور');
    }
  }

  //--------------------------------------------------------------------- Search by Phone
  async searchByPhone(phone: string) {
    return this.contactRepository.find({
      where: { phone: Like(`${phone}%`) },
      take: 5,
    });
  }

  //--------------------------------------------------------------------- Find Users With Contacts
  async findUsersWithContacts() {
    return this.userRepository.find({
      relations: ['contacts'],
      order: { id: 'ASC' },
    });
  }

  //--------------------------------------------------------------------- Update (Only one contact of user)
  async update(id: number, dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    if (dto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!user) throw new NotFoundException('User not found');
      contact.user = user;
    }

    // فقط اگر phone ارسال شده و با phone فعلی متفاوت است، دنبال شماره تکراری بگرد
    if (dto.phone && dto.phone !== contact.phone) {
      const existing = await this.contactRepository.findOne({
        where: { phone: dto.phone },
      });

      // اگر موجود بود و متعلق به رکورد دیگری بود -> Conflict
      if (existing && existing.id !== id) {
        throw new ConflictException(`شماره ${dto.phone} قبلاً ثبت شده است.`);
      }
    }

    Object.assign(contact, dto);
    try {
      return await this.contactRepository.save(contact);
    } catch (error) {
      // بهتر خطاهای یونیک کانستِرِینت دیتابیس رو هم هندل کنیم
      // (اختیاری) اگر بخواهی می‌توانی بسته به DB error.code هم Conflict برگردانی
      throw new InternalServerErrorException('خطای داخلی سرور');
    }
  }

  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888
  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888
  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888
  //--------------------------------------------------------------------- Bulk Update (All contacts of user)
  async bulkUpdate(dto: BulkUpdateContactsDto): Promise<Contact[]> {
    const contacts = dto.contacts || [];

    return await this.contactRepository.manager.transaction(async (manager) => {
      const results: Contact[] = [];

      // 🔹 بررسی شماره‌های غیرخالی
      const phones = contacts
        .filter((c) => c.phone && c.phone.trim() !== '')
        .map((c) => {
          const phone = c.phone!.trim();
          // 🔹 اعتبارسنجی شماره ایران
          if (!/^0[0-9]{10}$/.test(phone)) {
            throw new BadRequestException(
              `شماره ${phone} نامعتبر است. شماره باید ۱۱ رقم باشد و با 0 شروع شود (مثلاً 09123456789)`,
            );
          }
          return phone;
        });

      // 🔹 بررسی تکراری بودن شماره در فرم
      const duplicateInForm = phones.find(
        (phone, idx) => phones.indexOf(phone) !== idx,
      );
      if (duplicateInForm) {
        throw new BadRequestException(
          `شماره ${duplicateInForm} در لیست مخاطبین تکراری است`,
        );
      }

      // پردازش همه مخاطبین
      for (const c of contacts) {
        const isEmpty =
          (!c.phone || c.phone.trim() === '') &&
          (!c.email || c.email.trim() === '') &&
          (!c.address || c.address.trim() === '');

        // اگر شماره خالی است و id داریم ⇒ حذف
        if (c.id && (!c.phone || c.phone.trim() === '')) {
          const existing = await manager.findOne(Contact, {
            where: { id: c.id },
          });
          if (existing) {
            await manager.delete(Contact, { id: c.id });
          }
          continue; // حذف شد ⇒ به نتایج اضافه نمی‌کنیم
        }

        // اگر مخاطب جدید کاملاً خالی است ⇒ نادیده گرفتن
        if (!c.id && isEmpty) {
          continue;
        }

        // 🔹 بررسی تکراری بودن شماره در دیتابیس
        if (c.phone) {
          const existingWithPhone = await manager.findOne(Contact, {
            where: { phone: c.phone },
          });
          if (existingWithPhone && existingWithPhone.id !== c.id) {
            throw new BadRequestException(
              `شماره ${c.phone} قبلاً برای مخاطب دیگری ثبت شده`,
            );
          }
        }

        // آماده‌سازی فیلدها
        const email = c.email?.trim() || undefined;
        const address = c.address?.trim() || undefined;

        let user: User | undefined;

        // 1️⃣ مدیریت user
        if (c.userId) {
          const foundUser = await manager.findOne(User, {
            where: { id: c.userId },
          });
          if (!foundUser) {
            throw new BadRequestException(`userId نامعتبر است (${c.userId})`);
          }
          user = foundUser;
        } else if (c.userName) {
          const name = c.userName.trim();
          const foundUser = await manager
            .createQueryBuilder(User, 'user')
            .where('LOWER(user.name) = LOWER(:name)', { name })
            .getOne();

          if (foundUser) {
            user = foundUser;
          } else {
            user = manager.create(User, { name });
            user = await manager.save(User, user);
          }
        } else if (!c.id) {
          // اگر مخاطب جدید است و userId یا userName نداریم
          throw new BadRequestException(
            'برای ایجاد مخاطب جدید، userId یا userName الزامی است',
          );
        }

        // 2️⃣ آپدیت یا ایجاد مخاطب
        if (c.id) {
          // آپدیت
          const existing = await manager.findOne(Contact, {
            where: { id: c.id },
            relations: ['user'],
          });
          if (!existing) {
            throw new BadRequestException(`مخاطب با id ${c.id} پیدا نشد`);
          }

          Object.assign(existing, {
            phone: c.phone,
            email: c.email ?? null,
            address: c.address ?? null,
          });

          if (user) {
            existing.user = user;
          }

          results.push(await manager.save(Contact, existing));
        } else {
          // ایجاد
          if (!user) {
            throw new BadRequestException('کاربر برای مخاطب جدید پیدا نشد');
          }

          const newContact = manager.create(Contact, {
            phone: c.phone,
            email,
            address,
            user,
          });

          results.push(await manager.save(Contact, newContact));
        }
      }

      return results;
    });
  }

  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888
  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888
  //8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888

  //--------------------------------------------------------------------- Remove
  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }

  //--------------------------------------------------------------------- Check Duplicate Phone
  async isDuplicateContact(name: string, phone: string): Promise<boolean> {
    const contact = await this.contactRepository.findOne({
      where: [
        { phone },
        {
          user: Raw((alias) => `LOWER(${alias}.name) = LOWER(:name)`, { name }), // غیرحساس به حروف بزرگ و کوچک
        },
      ],
    });
    return !!contact;
  }
}
