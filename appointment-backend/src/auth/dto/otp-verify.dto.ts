import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class OtpEmailVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  code!: string;
}
