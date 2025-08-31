// src/contact/dto/create-contact.dto.ts
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactDto {
  // اگر userName وجود نداشت، userId باید اعتبارسنجی شود
  // @ValidateIf((o) => !o.userName)
  // @IsNotEmpty({ message: 'userId یا userName باید وارد شود' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  // اعتبارسنجی شرطی: حداقل یکی از userId یا userName باید باشد
  @ValidateIf((o) => !o.userId)
  @IsNotEmpty({ message: 'اگر کاربر موجود نیست، userName الزامی است.' })
  @IsOptional()
  @IsString()
  userName?: string;

  //@Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits.' })
  @IsNotEmpty()
  @Matches(/^[0-9]{11}$/, { message: 'Phone number must be 11 digits' })
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
