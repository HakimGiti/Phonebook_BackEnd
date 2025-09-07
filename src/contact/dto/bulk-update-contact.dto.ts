// src/contact/dto/bulk-update-contact.dto.ts
import {
  IsInt,
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SingleUpdateContactDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsString()
  @Matches(/^0[0-9]{10}$/, {
    message: 'شماره تلفن باید ۱۱ رقم باشد و با 0 شروع شود .',
  })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  userName?: string;
}

export class BulkUpdateContactsDto {
  @ValidateNested({ each: true })
  @Type(() => SingleUpdateContactDto)
  contacts: SingleUpdateContactDto[];
}
