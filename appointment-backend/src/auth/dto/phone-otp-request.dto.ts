import { IsNotEmpty, IsString } from 'class-validator';

export class OtpPhoneRequestDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}
