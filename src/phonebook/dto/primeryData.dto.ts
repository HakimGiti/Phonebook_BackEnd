import {
  IsOptional,
  IsString,
  IsNotEmpty,
  Matches,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class PrimeryDataDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'شماره تلفن نباید خالی باشد' })
  @IsString({ message: 'شماره تلفن باید رشته باشد' })
  @Matches(/^\d{10,15}$/, {
    message: 'شماره تلفن باید فقط شامل ارقام باشد و حداقل 10 رقم',
  })
  phone: string;

  @ValidateIf((o) => o.email !== '') // ایمیل می تواند خالی باشد
  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل رعایت نشده است' })
  email?: string;
}