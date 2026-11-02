import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { AvailabilityService } from './availability.service';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  Matches,
  IsOptional,
} from 'class-validator';

class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @IsInt()
  @Min(10)
  @Max(120)
  slotMins!: number;

  // Optional timezone offset in minutes (e.g. IST = +330). If provided, startTime/endTime
  // are interpreted in doctor's local timezone and will be converted to UTC when saved.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  timezoneOffsetMinutes?: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getAvailability(@GetUser() user: AuthUser) {
    return this.availabilityService.getByDoctorUserId(user.sub);
  }

  @Post()
  create(@GetUser() user: AuthUser, @Body() body: CreateAvailabilityDto) {
    return this.availabilityService.create(user.sub, body);
  }

  @Delete()
  deleteAll(@GetUser() user: AuthUser) {
    return this.availabilityService.deleteByDoctorUserId(user.sub);
  }
}
