import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findByName(name: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { name } });
  }

  async create(data: { name: string }): Promise<User> {
    const newUser = this.userRepository.create(data); // فقط name
    return await this.userRepository.save(newUser);
  }
}
