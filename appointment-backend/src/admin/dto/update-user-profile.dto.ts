import { IsOptional, IsString, IsEmail, IsPhoneNumber, IsInt, Min, Max, IsBoolean, IsEnum, Matches, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingMode, DoctorApprovalStatus } from '@prisma/client';

export class UpdateUserProfileDto {
  // User base fields
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone format (E.164)' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // DoctorProfile fields
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString({ each: true })
  subSpecialties?: string[];

  @IsOptional()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  graduationYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsEnum(BookingMode)
  bookingMode?: BookingMode;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  responseTimeMins?: number;

  @IsOptional()
  nextAvailableAt?: Date;

  @IsOptional()
  @IsString({ each: true })
  consultationModes?: string[];

  @IsOptional()
  @IsBoolean()
  onlineConsultation?: boolean;

  @IsOptional()
  @IsEnum(DoctorApprovalStatus)
  onboardingStatus?: DoctorApprovalStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;

  // PatientProfile fields
  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  address?: string;
}
