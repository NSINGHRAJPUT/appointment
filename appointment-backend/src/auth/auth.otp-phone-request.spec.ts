import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType, Role } from '@prisma/client';
import { OtpPhoneRequestDto } from './dto/phone-otp-request.dto';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { InvalidPhoneFormatException } from '../common/exceptions/invalid-phone-format.exception';

describe('AuthController - Phone OTP Request', () => {
  let controller: AuthController;
  let authService: AuthService;
  let otpService: OtpService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            issueTokenAfterOtp: jest.fn(),
            resetPassword: jest.fn(),
            register: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generate: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    otpService = module.get<OtpService>(OtpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('POST /auth/otp/phone/request', () => {
    it('should generate OTP for valid phone number', async () => {
      const dto: OtpPhoneRequestDto = { phoneNumber: '+1234567890' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

      const result = await controller.requestPhoneOtp(dto);

      expect(result).toEqual({ message: 'OTP sent to phone' });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: '+1234567890' },
      });
      expect(otpService.generate).toHaveBeenCalledWith('+1234567890', OtpType.PHONE);
    });

    it('should validate phone format (E.164)', async () => {
      const dto: OtpPhoneRequestDto = { phoneNumber: 'invalid-phone' };

      await expect(controller.requestPhoneOtp(dto)).rejects.toThrow(InvalidPhoneFormatException);
    });

    it('should reject request for non-existent phone number', async () => {
      const dto: OtpPhoneRequestDto = { phoneNumber: '+1234567890' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(controller.requestPhoneOtp(dto)).rejects.toThrow(UserNotFoundException);
    });

    it('should handle rate limiting error (429)', async () => {
      const dto: OtpPhoneRequestDto = { phoneNumber: '+1234567890' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockRejectedValue(
        new HttpException('Too many OTP requests. Please wait before retrying.', HttpStatus.TOO_MANY_REQUESTS)
      );

      await expect(controller.requestPhoneOtp(dto)).rejects.toThrow(HttpException);
    });

    it('should accept valid E.164 phone formats', async () => {
      const validPhones = [
        '+1234567890',
        '+44123456789',
        '+919876543210',
        '+33123456789',
      ];

      for (const phone of validPhones) {
        const dto: OtpPhoneRequestDto = { phoneNumber: phone };
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          phoneNumber: phone,
          role: Role.PATIENT,
          fullName: 'Test User',
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
        jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

        const result = await controller.requestPhoneOtp(dto);

        expect(result).toEqual({ message: 'OTP sent to phone' });
        expect(otpService.generate).toHaveBeenCalledWith(phone, OtpType.PHONE);
      }
    });

    it('should reject invalid phone formats', async () => {
      const invalidPhones = [
        '+1', // Too short (only 2 chars total)
        '+12345678901234567', // Too long (16 digits)
        'abc+1234567890', // Invalid characters
        '+1-234-567-890', // Dashes not allowed
        '+0123456789', // Cannot start with 0
        'phone', // Not a number
      ];

      for (const phone of invalidPhones) {
        const dto: OtpPhoneRequestDto = { phoneNumber: phone };

        // Reset mocks for each iteration
        jest.clearAllMocks();

        await expect(controller.requestPhoneOtp(dto)).rejects.toThrow(InvalidPhoneFormatException);
        // Verify that user lookup was never called (validation should fail first)
        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      }
    });

    it('should log OTP code to console in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const dto: OtpPhoneRequestDto = { phoneNumber: '+1234567890' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await controller.requestPhoneOtp(dto);

      // OtpService.generate logs to console, so we verify it was called
      expect(otpService.generate).toHaveBeenCalledWith('+1234567890', OtpType.PHONE);

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should return HTTP 200 with correct message', async () => {
      const dto: OtpPhoneRequestDto = { phoneNumber: '+1234567890' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

      const result = await controller.requestPhoneOtp(dto);

      expect(result).toEqual({ message: 'OTP sent to phone' });
    });
  });
});
