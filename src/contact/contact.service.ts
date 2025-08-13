// /src/contact/contact.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { User } from '../user/user.entity';
import { validateOrReject } from 'class-validator';
import { CreateSimpleUserDto } from 'src/user/dto/create-simple-user.dto';

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
  async findAllWithUsers() {
    return this.contactRepository.find({
      relations: ['user'],
    });
  }
  //--------------------------------------------------------------------- Create ##########################
  async create(dto: CreateContactDto): Promise<Contact> {
    let user: User | null = null;

    if (dto.userId) {
      // ✅ اگر userId داده شده
      user = await this.userRepository.findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('User not found');
    } else if (dto.userName) {
      // ✅ اگر userName داده شده → کاربر جدید بساز ------------
      user = this.userRepository.create({
        name: dto.userName,
        nationalCode: '0000000000', // مقدار پیش‌فرض مناسب
        username: 'user_' + Date.now(), // یکتا
        password: 'Temp123!', // یا هر مقدار امن پیش‌فرض
        job: 'نامشخص',
        gender: 'male', // یا female
        nationalId: '0000000000',
      });
      user = await this.userRepository.save(user);
    } else {
      // ❌ هیچ‌کدوم نباشه → خطا
      throw new NotFoundException('User ID or User Name is required');
      //throw new BadRequestException('UserId or userName required');
    }
    const contact = this.contactRepository.create({ ...dto, user });
    //const contact = this.contactRepository.create({user, phone: dto.phone, email: dto.email, address: dto.address });
    return this.contactRepository.save(contact);
  }
//--------------------------------------------------------------------- Find Users With Contacts
  async findUsersWithContacts() {
    return this.userRepository.find({
      relations: ['contacts'], // لود کردن روابط
      order: { id: 'ASC' }, // ترتیب اختیاری
    });
  }
//--------------------------------------------------------------------- Update
  async update(id: number, dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    if (dto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!user) throw new NotFoundException('User not found');
      contact.user = user;
    }

    Object.assign(contact, dto);
    return this.contactRepository.save(contact);
  }
//--------------------------------------------------------------------- Remove
  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id); // findOne با relation user

    await this.contactRepository.remove(contact);
  }
}
