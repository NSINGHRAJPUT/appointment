import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { AdminService } from './admin.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Role } from '@prisma/client';

class PendingDoctorsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  pageSize = 10;
}

class AdminUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(500)
  pageSize = 50;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('doctors/:doctorId/approval')
  approveDoctor(
    @GetUser() _user: AuthUser,
    @Param('doctorId') doctorId: string,
    @Body() body: { approve: boolean; notes?: string },
  ) {
    return this.adminService.updateDoctorApproval(doctorId, body.approve, body.notes);
  }

  @Get('dashboard')
  async dashboard() {
    const [users, doctors, patients, pendingDoctors, appointments] =
      await this.adminService.getDashboard();
    return { users, doctors, patients, pendingDoctors, appointments };
  }

  @Get('doctors/pending')
  listPending(@Query() query: PendingDoctorsQueryDto) {
    return this.adminService.listPendingDoctors(query);
  }

  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.listAllUsers(query);
  }

  @Get('users/:userId')
  getUserDetails(@Param('userId') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:userId/profile')
  updateUserProfile(
    @GetUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() body: UpdateUserProfileDto,
  ) {
    return this.adminService.updateUserProfile(user.sub, userId, body);
  }

  @Patch('users/:userId')
  updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, body);
  }

  @Patch('users/:userId/deactivate')
  deactivateUser(@Param('userId') userId: string) {
    return this.adminService.deactivateUser(userId);
  }

  @Patch('users/:userId/activate')
  activateUser(@Param('userId') userId: string) {
    return this.adminService.activateUser(userId);
  }

  @Get('appointments')
  listAppointments(@Query() query: PendingDoctorsQueryDto) {
    return this.adminService.listAllAppointments(query);
  }
}
