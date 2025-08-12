import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { User } from '../user/user.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async findAllWithUsers() {
    return this.contactRepository.find({
      relations: ['user'],
    });
  }

  async create(dto: CreateContactDto): Promise<Contact> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const contact = this.contactRepository.create({ ...dto, user });
    return this.contactRepository.save(contact);
  }

  async findUsersWithContacts() {
    return this.userRepository.find({
      relations: ['contacts'], // لود کردن روابط
      order: { id: 'ASC' }, // ترتیب اختیاری
    });
  }

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

  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id); // findOne با relation user

    await this.contactRepository.remove(contact);
  }
}
