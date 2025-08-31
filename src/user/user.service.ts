// /src/user/user.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Raw } from 'typeorm';
// import { Like } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async findByName(name: string) {
  //   return this.userRepository.findOne({ where: { name } });
  // }
  async findByName(name: string) {
    return this.userRepository.findOne({
      where: {
        name: Raw((alias) => `LOWER(${alias}) = LOWER(:name)`, { name }), // غیرحساس به حروف بزرگ و کوچک
      },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(dto);
    console.log('dtouser=', dto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['contacts'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['contacts'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // جستجوی کاربر بر اساس نام (Partial match)
  async searchByName(name: string): Promise<User[]> {
    if (!name) return [];
    return this.userRepository.find({
      where: {
        name: Raw((alias) => `LOWER(${alias}) LIKE :name`, {
          name: `%${name.toLowerCase()}%`,
        }), // غیرحساس به حروف بزرگ و کوچک
      },
      take: 10, // حداکثر 10 نتیجه
      order: { name: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
