import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('AuthService admin registration guard', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), create: jest.fn() },
            doctorProfile: { findUnique: jest.fn() },
            doctorDocument: { create: jest.fn() },
            appointment: { updateMany: jest.fn() },
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: CloudinaryService, useValue: { uploadFile: jest.fn() } },
        { provide: EmailService, useValue: { sendSignupConfirmation: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('rejects self-registration with ADMIN role', async () => {
    await expect(
      authService.register({
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: Role.ADMIN,
        phone: '9876543210',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      authService.register({
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: Role.ADMIN,
        phone: '9876543210',
      }),
    ).rejects.toThrow('Admin accounts cannot be self-registered');
  });
});
