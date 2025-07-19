import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteContactDto {
  @IsNotEmpty()
  @Type(() => Number) // ❗ بسیار مهم برای تبدیل رشته به عدد
  @IsInt({ message: 'id باید یک عدد صحیح باشد' })
  id: number;
}
