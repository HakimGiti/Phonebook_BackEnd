import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Contact } from '../contact/contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true, length: 10 })
  nationalCode: string;

  @Column({ unique: true })
  nationalId: string;

  @Column({ length: 100 })
  job: string;

  @Column({ type: 'enum', enum: ['male', 'female'] })
  gender: 'male' | 'female';

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];
}
