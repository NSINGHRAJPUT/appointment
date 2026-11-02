import { IsEmail, IsNotEmpty } from 'class-validator';

export class OtpEmailRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
