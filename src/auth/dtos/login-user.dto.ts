import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
