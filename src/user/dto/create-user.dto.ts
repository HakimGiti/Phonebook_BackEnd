import {
  IsString,
  IsNotEmpty,
  IsIn,
  Length,
  Matches,
  IsNumberString,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 20, { message: 'Username must be between 3 and 20 characters.' })
  @Matches(/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z_][a-zA-Z0-9._]*$/, {
    message:
      'Username must start with a letter or underscore, can contain letters, numbers, underscores, and dots; dots cannot be at start/end or be consecutive.',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 32, { message: 'Password must be between 8 and 32 characters.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?])[A-Za-z\d!@#$%^&*()_\-+=<>?]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;

  @IsString()
  @Matches(/^\d{10}$/, { message: 'شناسه ملی باید دقیقا ۱۰ رقم باشد' })
  nationalCode: string;

  @IsString()
  @IsNotEmpty()
  job: string;

  @IsString()
  @IsIn(['male', 'female'])
  gender: 'male' | 'female';

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'شناسه ملی باید دقیقا ۱۰ رقم باشد' })
  @IsNumberString()
  nationalId: string;
}
