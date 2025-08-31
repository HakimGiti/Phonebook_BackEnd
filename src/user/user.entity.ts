// src/user/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Contact } from '../contact/contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string; // اجباری

  @Column({ nullable: true, length: 50 })
  username?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true, length: 10, nullable: true })
  nationalCode?: string;

  @Column({ nullable: true })
  nationalId?: string;

  @Column({ nullable: true, type: 'enum', enum: ['male', 'female'] })
  gender?: 'male' | 'female';

  @Column({ nullable: true, length: 100 })
  job?: string;

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];
}
