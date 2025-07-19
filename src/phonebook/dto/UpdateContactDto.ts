import { IsOptional, IsString, IsEmail, ValidateIf } from 'class-validator';
export class UpdateContactDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone: string;

  @ValidateIf((o) => o.email !== '') // ایمیل می تواند خالی باشد
  @IsOptional()
  @IsEmail({}, { message: 'ایمیل وارد شده معتبر نیست' })
  email?: string;
}
