import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { OtpType } from '@prisma/client';
import { OtpService } from './otp.service';

class SendOtpDto {
  @IsString()
  target!: string; // phone number or email

  @IsEnum(OtpType)
  type!: OtpType;

  /** When verifying by phone, optionally email the same OTP code. */
  @IsOptional()
  @IsEmail()
  alsoNotifyEmail?: string;
}

class VerifyOtpDto {
  @IsString()
  target!: string;

  @IsEnum(OtpType)
  type!: OtpType;

  @IsString()
  @Length(6, 6)
  code!: string;
}

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async send(@Body() dto: SendOtpDto) {
    await this.otpService.generate(dto.target, dto.type, {
      alsoNotifyEmail: dto.alsoNotifyEmail,
      context: 'booking',
    });
    return { message: 'OTP sent' };
  }

  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async verify(@Body() dto: VerifyOtpDto) {
    await this.otpService.verify(dto.target, dto.code, dto.type);
    return { verified: true };
  }
}
