// src/user/dto/create-simple-user.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSimpleUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
