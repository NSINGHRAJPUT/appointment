import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { PatientService } from './patient.service';

class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('me')
  me(@GetUser() user: AuthUser) {
    return this.patientService.profile(user.sub);
  }

  @Put('profile')
  updateProfile(
    @GetUser() user: AuthUser,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patientService.updateProfile(user.sub, dto);
  }
}
