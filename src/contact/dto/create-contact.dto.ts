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

  @IsNotEmpty()
  @Matches(/^0[0-9]{10}$/, {
    message: 'شماره تلفن باید ۱۱ رقم باشد و با 0 شروع شود .',
  })
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
