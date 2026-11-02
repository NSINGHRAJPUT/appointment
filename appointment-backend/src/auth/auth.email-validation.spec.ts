import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpEmailRequestDto } from './dto/otp-request.dto';
import { OtpEmailVerifyDto } from './dto/otp-verify.dto';
import { OtpType, Role } from '@prisma/client';
import { InvalidEmailFormatException } from '../common/exceptions/invalid-email-format.exception';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { validateEmailFormat } from '../common/validators/email-phone.validator';

describe('Email Validation and Error Handling', () => {
  let controller: AuthController;
  let otpService: OtpService;
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            issueTokenAfterOtp: jest.fn(),
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
    otpService = module.get<OtpService>(OtpService);
    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('Email Format Validation', () => {
    describe('Valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
        'a@b.co',
        'patient1@yopmail.com',
        'doctor1@yopmail.com',
      ];

      validEmails.forEach((email) => {
        it(`should accept valid email: ${email}`, () => {
          expect(() => validateEmailFormat(email)).not.toThrow();
        });
      });
    });

    describe('Invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test@.com',
        'test..name@example.com',
        'test @example.com',
        'test@example',
        '',
        'test@example..com',
      ];

      invalidEmails.forEach((email) => {
        it(`should reject invalid email: ${email}`, () => {
          expect(() => validateEmailFormat(email)).toThrow(InvalidEmailFormatException);
        });
      });
    });
  });

  describe('POST /auth/otp/email/request - Email Validation', () => {
    it('should throw InvalidEmailFormatException for invalid email format', async () => {
      const dto: OtpEmailRequestDto = { email: 'invalid-email' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
        expect(error.message).toBe('Invalid email format');
      }
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      const dto: OtpEmailRequestDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown UserNotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundException);
        expect(error.message).toBe('User not found');
      }
    });

    it('should return 200 with valid email and existing user', async () => {
      const dto: OtpEmailRequestDto = { email: 'test@example.com' };
      const mockUser = { id: '1', email: 'test@example.com', fullName: 'Test User' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

      const result = await controller.requestEmailOtp(dto);

      expect(result).toEqual({ message: 'OTP sent to email' });
      expect(otpService.generate).toHaveBeenCalledWith(dto.email, OtpType.EMAIL);
    });

    it('should not expose sensitive information in error response', async () => {
      const dto: OtpEmailRequestDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown UserNotFoundException');
      } catch (error) {
        const response = error.getResponse();
        // Ensure error response doesn't contain database details or internal paths
        const responseStr = JSON.stringify(response);
        expect(responseStr).not.toContain('database');
        expect(responseStr).not.toContain('prisma');
        expect(responseStr).not.toContain('src/');
      }
    });

    it('should validate email before checking user existence', async () => {
      const dto: OtpEmailRequestDto = { email: 'invalid-email' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
        // Ensure findUnique was not called (validation happened first)
        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      }
    });

    it('should handle various valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'patient1@yopmail.com',
        'doctor1@yopmail.com',
      ];

      for (const email of validEmails) {
        const dto: OtpEmailRequestDto = { email };
        const mockUser = { id: '1', email, fullName: 'Test User' };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
        jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

        const result = await controller.requestEmailOtp(dto);

        expect(result).toEqual({ message: 'OTP sent to email' });
      }
    });
  });

  describe('POST /auth/otp/email/verify - Email Validation', () => {
    it('should throw InvalidEmailFormatException for invalid email format', async () => {
      const dto: OtpEmailVerifyDto = { email: 'invalid-email', code: '123456' };

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
        expect(error.message).toBe('Invalid email format');
      }
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      const dto: OtpEmailVerifyDto = { email: 'nonexistent@example.com', code: '123456' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown UserNotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundException);
        expect(error.message).toBe('User not found');
      }
    });

    it('should return 200 with token and user profile for valid email and OTP', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
        fullName: 'Test User',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: Role.PATIENT,
          fullName: 'Test User',
          doctorProfile: null,
          patientProfile: { id: 'patient-1' },
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      const result = await controller.verifyEmailOtp(dto);

      expect(result).toEqual({
        token: mockToken.accessToken,
        user: mockToken.user,
      });
    });

    it('should not expose sensitive information in error response', async () => {
      const dto: OtpEmailVerifyDto = { email: 'nonexistent@example.com', code: '123456' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown UserNotFoundException');
      } catch (error) {
        const response = error.getResponse();
        // Ensure error response doesn't contain database details or internal paths
        const responseStr = JSON.stringify(response);
        expect(responseStr).not.toContain('database');
        expect(responseStr).not.toContain('prisma');
        expect(responseStr).not.toContain('src/');
      }
    });

    it('should validate email before checking user existence', async () => {
      const dto: OtpEmailVerifyDto = { email: 'invalid-email', code: '123456' };

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
        // Ensure findUnique was not called (validation happened first)
        expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      }
    });
  });

  describe('Error Response Format', () => {
    it('should return proper error format for InvalidEmailFormatException', async () => {
      const dto: OtpEmailRequestDto = { email: 'invalid-email' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        const response = error.getResponse();
        expect(response.message).toBe('Invalid email format');
      }
    });

    it('should return proper error format for UserNotFoundException', async () => {
      const dto: OtpEmailRequestDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown UserNotFoundException');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.message).toBe('User not found');
      }
    });
  });

  describe('Email Validation Edge Cases', () => {
    it('should handle email with special characters', async () => {
      const dto: OtpEmailRequestDto = { email: 'test+tag@example.com' };
      const mockUser = { id: '1', email: 'test+tag@example.com', fullName: 'Test User' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

      const result = await controller.requestEmailOtp(dto);

      expect(result).toEqual({ message: 'OTP sent to email' });
    });

    it('should handle email with subdomain', async () => {
      const dto: OtpEmailRequestDto = { email: 'test@mail.example.co.uk' };
      const mockUser = { id: '1', email: 'test@mail.example.co.uk', fullName: 'Test User' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'generate').mockResolvedValue('123456');

      const result = await controller.requestEmailOtp(dto);

      expect(result).toEqual({ message: 'OTP sent to email' });
    });

    it('should reject email with spaces', async () => {
      const dto: OtpEmailRequestDto = { email: 'test @example.com' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
      }
    });

    it('should reject email with missing domain', async () => {
      const dto: OtpEmailRequestDto = { email: 'test@' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
      }
    });

    it('should reject email with missing local part', async () => {
      const dto: OtpEmailRequestDto = { email: '@example.com' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
      }
    });

    it('should reject empty email', async () => {
      const dto: OtpEmailRequestDto = { email: '' };

      try {
        await controller.requestEmailOtp(dto);
        fail('Should have thrown InvalidEmailFormatException');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEmailFormatException);
      }
    });
  });
});
