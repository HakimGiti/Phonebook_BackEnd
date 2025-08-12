import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @IsNotEmpty()
  @Matches(/^[0-9]{11}$/, { message: 'Phone number must be 11 digits' })
  //@Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits.' })
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
