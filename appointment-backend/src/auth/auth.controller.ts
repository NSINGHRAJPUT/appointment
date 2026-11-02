import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Role, OtpType, BookingMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { GetUser } from './get-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthUser } from './auth.types';
import { IsValidFiles } from './file-validation.decorator';
import { OtpService } from '../otp/otp.service';
import { OtpEmailRequestDto } from './dto/otp-request.dto';
import { OtpEmailVerifyDto } from './dto/otp-verify.dto';
import { OtpPhoneRequestDto } from './dto/phone-otp-request.dto';
import { OtpPhoneVerifyDto } from './dto/phone-otp-verify.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import {
  validateEmailFormat,
  validatePhoneFormat,
  validatePasswordLength,
} from '../common/validators/email-phone.validator';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';

interface FileObject {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

class TimeSlotDto {
  @IsString()
  @IsNotEmpty()
  day!: string;

  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsString()
  @IsNotEmpty()
  to!: string;
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEnum(Role)
  role!: Role;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  // Doctor-only fields
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() experience?: string;
  @IsOptional() @IsString() yearsOfExperience?: string;
  @IsOptional() @IsString() degree?: string;
  @IsOptional() @IsString() university?: string;
  @IsOptional() @IsString() graduationYear?: string;
  @IsOptional() @IsString() primarySpecialty?: string;
  @IsOptional() @IsString() specialization?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // If it's already an array
    if (Array.isArray(value)) {
      // Check if it's an array of strings that look like JSON
      if (value.length > 0 && typeof value[0] === 'string') {
        try {
          // Try to parse the first element as JSON
          const parsed = JSON.parse(value[0]);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Not JSON, treat as regular array of strings
          return value;
        }
      }
      return value;
    }

    // If it's a string
    if (typeof value === 'string') {
      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, split by comma
        return value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  subSpecialties?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // If it's already an array
    if (Array.isArray(value)) {
      // Check if it's an array of strings that look like JSON
      if (value.length > 0 && typeof value[0] === 'string') {
        try {
          // Try to parse the first element as JSON
          const parsed = JSON.parse(value[0]);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Not JSON, treat as regular array of strings
          return value;
        }
      }
      return value;
    }

    // If it's a string
    if (typeof value === 'string') {
      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, split by comma
        return value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional() @IsString() clinicName?: string;
  @IsOptional() @IsString() clinicAddress?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() consultationFee?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return undefined;
  })
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    return undefined;
  })
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(BookingMode)
  bookingMode?: BookingMode;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return undefined;
  })
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value, 10);
    return undefined;
  })
  @IsNumber()
  responseTimeMins?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // If it's already an array
    if (Array.isArray(value)) {
      // Check if it's an array of strings that look like JSON
      if (value.length > 0 && typeof value[0] === 'string') {
        try {
          // Try to parse the first element as JSON
          const parsed = JSON.parse(value[0]);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // Not JSON, treat as regular array of strings
          return value;
        }
      }
      return value;
    }

    // If it's a string
    if (typeof value === 'string') {
      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, split by comma
        return value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }

    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  consultationModes?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return undefined;
  })
  @IsBoolean()
  onlineConsultation?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // If it's a string, try to parse as JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const validSlots = parsed
            .filter(
              (slot) =>
                slot &&
                Object.keys(slot).length > 0 &&
                (slot.day || slot.from || slot.to),
            )
            .map((slot) => ({
              day: slot.day || slot.dayOfWeek,
              from: slot.from || slot.startTime,
              to: slot.to || slot.endTime,
            }));
          return validSlots.length > 0 ? validSlots : undefined;
        }
        return undefined;
      } catch {
        return undefined;
      }
    }

    // If it's already an array
    if (Array.isArray(value)) {
      const validSlots = value
        .filter(
          (slot) =>
            slot &&
            Object.keys(slot).length > 0 &&
            (slot.day || slot.from || slot.to),
        )
        .map((slot) => ({
          day: slot.day || slot.dayOfWeek,
          from: slot.from || slot.startTime,
          to: slot.to || slot.endTime,
        }));
      return validSlots.length > 0 ? validSlots : undefined;
    }

    return undefined;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots?: TimeSlotDto[];

  @IsOptional() @IsString() whatsapp?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true' || value === '1';
    return undefined;
  })
  @IsBoolean()
  whatsappOptOut?: boolean;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 5.5 * 1024 * 1024, // 5.5MB per file (5MB + overhead)
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only PDF, JPG, and PNG files are allowed'),
            false,
          );
        }
      },
    }),
  )
  register(@Body() dto: RegisterDto, @UploadedFiles() files?: Express.Multer.File[]) {
    // Validate that only doctors can upload documents
    if (files && files.length > 0 && dto.role !== Role.DOCTOR) {
      throw new BadRequestException('Only doctors can upload documents');
    }

    // Validate file count (max 5 files per registration)
    if (files && files.length > 5) {
      throw new BadRequestException('Maximum 5 files allowed per upload');
    }

    return this.authService.register({
      ...dto,
      documents: files,
    });
  }

  @Post('login')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@GetUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        doctorProfile: true,
        patientProfile: true,
      },
    });
  }

  @Post('otp/email/request')
  async requestEmailOtp(@Body() dto: OtpEmailRequestDto) {
    // Validate email format
    validateEmailFormat(dto.email);

    // Validate email exists in User table
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.otpService.generate(dto.email, OtpType.EMAIL, {
      context: 'login',
    });

    return { message: 'OTP sent to email' };
  }

  @Post('otp/email/verify')
  async verifyEmailOtp(@Body() dto: OtpEmailVerifyDto) {
    // Validate email format
    validateEmailFormat(dto.email);

    // Validate email exists in User table
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Verify OTP
    await this.otpService.verify(dto.email, dto.code, OtpType.EMAIL);

    // Issue JWT token after successful OTP verification
    const result = await this.authService.issueTokenAfterOtp(
      user.id,
      user.role,
      user.email,
    );

    return {
      token: result.accessToken,
      user: result.user,
    };
  }

  @Post('password-reset/request')
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    // Validate email format
    validateEmailFormat(dto.email);

    // Validate email exists in User table
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    await this.otpService.generate(dto.email, OtpType.EMAIL, {
      context: 'password_reset',
    });

    return { message: 'OTP sent to email' };
  }

  @Post('password-reset/verify')
  async verifyPasswordReset(@Body() dto: PasswordResetVerifyDto) {
    // Validate email format
    validateEmailFormat(dto.email);

    // Validate password length
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Validate email exists in User table
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Verify OTP
    await this.otpService.verify(dto.email, dto.code, OtpType.EMAIL);

    // Reset password
    await this.authService.resetPassword(user.id, dto.newPassword);

    return { message: 'Password reset successful' };
  }

  @Post('otp/phone/request')
  async requestPhoneOtp(@Body() dto: OtpPhoneRequestDto) {
    // Validate phone format (E.164 format: +1234567890)
    validatePhoneFormat(dto.phoneNumber);

    // Validate phone exists in User table
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Generate OTP
    await this.otpService.generate(dto.phoneNumber, OtpType.PHONE);

    return { message: 'OTP sent to phone' };
  }

  @Post('otp/phone/verify')
  async verifyPhoneOtp(@Body() dto: OtpPhoneVerifyDto) {
    // Validate phone format (E.164 format: +1234567890)
    validatePhoneFormat(dto.phoneNumber);

    // Validate phone exists in User table
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Verify OTP
    await this.otpService.verify(dto.phoneNumber, dto.code, OtpType.PHONE);

    // Issue JWT token after successful OTP verification
    const result = await this.authService.issueTokenAfterOtp(
      user.id,
      user.role,
      user.email,
    );

    return {
      token: result.accessToken,
      user: result.user,
    };
  }
}
