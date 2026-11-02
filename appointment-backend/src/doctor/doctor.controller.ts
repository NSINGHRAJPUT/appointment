import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { BookingMode } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { DoctorService } from './doctor.service';

class ListDoctorsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  /** Comma-separated specialty labels for multi-select OR filter */
  @IsOptional()
  @IsString()
  specialties?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' || value === true,
  )
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @IsIn(['next', 'rating'])
  sortBy?: 'next' | 'rating';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;
}

class DoctorOnboardingDto {
  @IsString()
  @IsNotEmpty()
  specialization!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  bio!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsString()
  @IsNotEmpty()
  clinicName!: string;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

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
  @IsString()
  @MaxLength(32)
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  graduationYear?: number;

  @IsOptional()
  @IsBoolean()
  onlineConsultation?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  subSpecialties?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];
}

class DoctorSettingsDto {
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
}

class DocumentUploadDto {
  @IsOptional()
  @IsString()
  title?: string;
}

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Post('onboarding')
  onboarding(@GetUser() user: AuthUser, @Body() body: DoctorOnboardingDto) {
    return this.doctorService.upsertOnboarding(user.sub, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Patch('settings')
  updateSettings(@GetUser() user: AuthUser, @Body() body: DoctorSettingsDto) {
    return this.doctorService.updateSettings(user.sub, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Get('profile')
  getProfile(@GetUser() user: AuthUser) {
    return this.doctorService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Put('profile')
  updateProfile(@GetUser() user: AuthUser, @Body() body: DoctorOnboardingDto) {
    return this.doctorService.updateProfile(user.sub, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Patch('onboarding/submit')
  submitOnboarding(@GetUser() user: AuthUser) {
    return this.doctorService.submitOnboarding(user.sub);
  }

  @Get('instant')
  instantAvailable() {
    return this.doctorService.findAvailableForInstant();
  }

  @Get('specialty-counts')
  specialtyCounts(@Query('labels') labels?: string) {
    const list = labels
      ? labels.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    return this.doctorService.getSpecialtyCounts(list);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Get('documents')
  async getOwnDocuments(@GetUser() user: AuthUser) {
    const doctorProfile = await this.doctorService.getDoctorProfileByUserId(
      user.sub,
    );
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }
    return this.doctorService.getDocuments(doctorProfile.id);
  }

  @Get()
  list(@Query() query: ListDoctorsQueryDto) {
    return this.doctorService.listDoctors(query);
  }

  @Get(':id/next-slots')
  nextSlots(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('count') count?: string,
  ) {
    const c = count ? Number(count) : 6;
    return this.doctorService.getNextAvailableSlots(id, from, c);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @GetUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: DocumentUploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Get the doctor profile to retrieve the doctorId
    const doctorProfile = await this.doctorService.getDoctorProfileByUserId(
      user.sub,
    );
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.doctorService.uploadDocument(
      doctorProfile.id,
      file,
      body.title,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR')
  @Delete('documents/:id')
  async deleteDocument(
    @GetUser() user: AuthUser,
    @Param('id') documentId: string,
  ) {
    // Get the doctor profile to retrieve the doctorId
    const doctorProfile = await this.doctorService.getDoctorProfileByUserId(
      user.sub,
    );
    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    // Call service to delete document (includes ownership verification)
    await this.doctorService.deleteDocument(doctorProfile.id, documentId);

    return { message: 'Document deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/documents')
  async getDocuments(@Param('id') doctorId: string) {
    return this.doctorService.getDocuments(doctorId);
  }
}
