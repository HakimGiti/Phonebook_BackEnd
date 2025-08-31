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
import { BulkUpdateContactDto } from './dto/updatebulk-contact.dto';

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

    // 1️⃣ بررسی userId معتبر
    if (dto.userId !== undefined && dto.userId !== null) {
      if (!Number.isInteger(dto.userId) || dto.userId <= 0) {
        throw new BadRequestException('userId نامعتبر است');
      }

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
        throw new ConflictException('این شماره قبلاً ثبت شده است.');
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
  //------------------------------------------------------------------------
  // async update(id: number, dto: UpdateContactDto): Promise<Contact> {
  //   const contact = await this.findOne(id);

  //   if (dto.userId) {
  //     const user = await this.userRepository.findOne({
  //       where: { id: dto.userId },
  //     });
  //     if (!user) throw new NotFoundException('User not found');
  //     contact.user = user;
  //   }

  //   //  بررسی شماره تکراری قبل از ذخیره کردن
  //   const existing = await this.contactRepository.findOne({
  //     where: { phone: dto.phone },
  //   });

  //   if (existing) {
  //     throw new ConflictException('این شماره قبلاً ثبت شده است.');
  //   }

  //   Object.assign(contact, dto);
  //   return this.contactRepository.save(contact);
  // }

  //--------------------------------------------------------------------- Bulk Update (All contacts of user)
  async updateBulk(dtos: BulkUpdateContactDto[]): Promise<Contact[]> {
    if (!Array.isArray(dtos) || dtos.length === 0) return [];

    const ids = dtos.map((d) => d.id);
    const newPhones = dtos.map((d) => d.phone).filter(Boolean) as string[];

    // 1) دریافت رکوردهایی که id آنها در ids است (مخاطبین هدف)
    const targetContacts = await this.contactRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });

    // map by id برای دسترسی سریع
    const targetById = new Map<number, Contact>();
    targetContacts.forEach((c) => targetById.set(c.id, c));

    // 2) دریافت رکوردهایی که phone آنها در newPhones است (ممکن است متعلق به همین ids یا دیگران باشد)
    const existingByPhoneList =
      newPhones.length > 0
        ? await this.contactRepository.find({ where: { phone: In(newPhones) } })
        : [];

    const existingByPhone = new Map<string, Contact>();
    existingByPhoneList.forEach((c) => existingByPhone.set(c.phone, c));

    // 3) اعتبارسنجی: اگر شماره‌ای در DB وجود دارد و متعلق به رکوردی نیست که داریم آپدیت می‌کنیم => conflict
    for (const dto of dtos) {
      if (dto.phone) {
        const found = existingByPhone.get(dto.phone);
        if (found && !ids.includes(found.id)) {
          throw new ConflictException(
            `شماره ${dto.phone} قبلاً توسط مخاطب دیگری ثبت شده است.`,
          );
        }
      }
    }

    // 4) انجام آپدیت‌ها در تراکنش (تا swap و وضعیت‌های همزمان به درستی انجام شود)
    const updated: Contact[] = await this.contactRepository.manager.transaction(
      async (manager) => {
        const res: Contact[] = [];

        for (const dto of dtos) {
          const contact = await manager.findOne(Contact, {
            where: { id: dto.id },
            relations: ['user'],
          });
          if (!contact)
            throw new NotFoundException(`Contact with id ${dto.id} not found`);

          // تغییر کاربر در صورت ارسال userId
          if (dto.userId && dto.userId !== contact.user?.id) {
            const user = await manager.findOne(User, {
              where: { id: dto.userId },
            });
            if (!user) throw new NotFoundException('User not found');
            contact.user = user;
          }

          // فقط فیلدهای مجاز را بروز کن
          if (dto.phone !== undefined) contact.phone = dto.phone;
          if (dto.email !== undefined) contact.email = dto.email;
          if (dto.address !== undefined) contact.address = dto.address;

          try {
            const saved = await manager.save(Contact, contact);
            res.push(saved);
          } catch (err) {
            throw new ConflictException(
              'خطا هنگام ذخیره‌سازی: تداخل داده‌ای رخ داد.',
            );
          }
        }

        return res;
      },
    );

    return updated;
  }
  //------------------------------------------------------------------------
  // async updateBulk(dtos: BulkUpdateContactDto[]): Promise<Contact[]> {
  //   const updatedContacts: Contact[] = [];
  //   console.log('updatedContacts', updatedContacts);
  //   for (const dto of dtos) {
  //     if (!dto.id) {
  //       throw new BadRequestException('id هر مخاطب برای بروزرسانی الزامی است');
  //     }

  //     const contact = await this.findOne(dto.id);

  //     if (dto.userId) {
  //       const user = await this.userRepository.findOne({
  //         where: { id: dto.userId },
  //       });
  //       if (!user) throw new NotFoundException('User not found');
  //       contact.user = user;
  //     }

  //     // بررسی شماره تکراری
  //     if (dto.phone && dto.phone !== contact.phone) {
  //       const existing = await this.contactRepository.findOne({
  //         where: { phone: dto.phone },
  //       });
  //       if (existing)
  //         throw new ConflictException('این شماره قبلاً ثبت شده است.');
  //     }

  //     Object.assign(contact, dto);
  //     updatedContacts.push(await this.contactRepository.save(contact));
  //   }

  //   return updatedContacts;
  // }

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
