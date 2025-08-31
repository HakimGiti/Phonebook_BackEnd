// src/contact/dto/bulk-update-contact.dto.ts
import { IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpdateContactDto {
  @IsInt()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @Matches(/^[0-9]{11}$/, { message: 'Phone number must be 11 digits' })
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;
}
