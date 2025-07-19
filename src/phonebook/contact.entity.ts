import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phone: string;

  @Column({ nullable: true }) // چون email اختیاریه
  email?: string;

  @ManyToOne(() => User, (user) => user.contacts, { eager: true }) // eager برای بارگذاری خودکار user با contact
  @JoinColumn({ name: 'userId' }) // ستونی به نام userId ایجاد می‌شه
  user: User;
}
