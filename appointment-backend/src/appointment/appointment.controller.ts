import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AppointmentStatus, OtpType } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { AppointmentService } from './appointment.service';

class BookAppointmentDto {
  @IsString()
  @MaxLength(64)
  doctorId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;
}

class GuestBookAppointmentDto {
  @IsString()
  @MaxLength(64)
  doctorId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  patientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  patientPhone!: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsString()
  @Length(6, 6)
  otpCode!: string;

  @IsString()
  otpTarget!: string;

  @IsEnum(OtpType)
  otpType!: OtpType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;
}

class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}

class PublicLookupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  query!: string;
}

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /** Authenticated booking (existing flow) */
  @UseGuards(JwtAuthGuard)
  @Post()
  book(@GetUser() user: AuthUser, @Body() dto: BookAppointmentDto) {
    return this.appointmentService.book(
      user.sub,
      dto.doctorId,
      dto.startAt,
      dto.endAt,
      dto.reason,
      dto.isInstant ?? false,
    );
  }

  /** Guest booking — no account required, OTP verified */
  @Post('guest')
  bookAsGuest(@Body() dto: GuestBookAppointmentDto) {
    return this.appointmentService.bookAsGuest(dto);
  }

  @Post('public-lookup')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  publicLookup(@Body() dto: PublicLookupDto) {
    return this.appointmentService.publicLookup(dto.query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateAppointmentStatusDto, @GetUser() user: AuthUser) {
    return this.appointmentService.updateStatus(user.sub, user.role, id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  myAppointments(@GetUser() user: AuthUser) {
    return this.appointmentService.myAppointments(user.sub, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.appointmentService.getById(id, user.sub, user.role);
  }
}
