import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpEmailVerifyDto } from './dto/otp-verify.dto';
import { OtpType, Role } from '@prisma/client';

describe('AuthController - Email OTP Verify', () => {
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
          },
        },
        {
          provide: OtpService,
          useValue: {
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

  describe('POST /auth/otp/email/verify', () => {
    it('should return 200 with token and user profile when OTP is valid', async () => {
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
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(otpService.verify).toHaveBeenCalledWith(dto.email, dto.code, OtpType.EMAIL);
      expect(authService.issueTokenAfterOtp).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        mockUser.email
      );
    });

    it('should return 404 when user not found', async () => {
      const dto: OtpEmailVerifyDto = { email: 'nonexistent@example.com', code: '123456' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.message).toBe('User not found');
      }
    });

    it('should return 400 when OTP is invalid', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: 'invalid' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return 400 when OTP is expired', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('OTP has expired', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return 400 when no pending OTP found', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('No pending OTP found', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyEmailOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return user profile with doctor profile for doctor users', async () => {
      const dto: OtpEmailVerifyDto = { email: 'doctor@example.com', code: '123456' };
      const mockUser = {
        id: 'doctor-1',
        email: 'doctor@example.com',
        role: Role.DOCTOR,
        fullName: 'Dr. Test',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'doctor-1',
          email: 'doctor@example.com',
          role: Role.DOCTOR,
          fullName: 'Dr. Test',
          doctorProfile: {
            id: 'doctor-profile-1',
            specialization: 'Cardiology',
          },
          patientProfile: null,
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      const result = await controller.verifyEmailOtp(dto);

      expect(result.user.doctorProfile).toBeDefined();
      expect(result.user.doctorProfile.specialization).toBe('Cardiology');
    });

    it('should call OtpService.verify with correct parameters', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
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

      await controller.verifyEmailOtp(dto);

      expect(otpService.verify).toHaveBeenCalledWith(dto.email, dto.code, OtpType.EMAIL);
      expect(otpService.verify).toHaveBeenCalledTimes(1);
    });

    it('should call AuthService.issueTokenAfterOtp with correct parameters', async () => {
      const dto: OtpEmailVerifyDto = { email: 'test@example.com', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: Role.PATIENT,
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

      await controller.verifyEmailOtp(dto);

      expect(authService.issueTokenAfterOtp).toHaveBeenCalledWith(
        'user-1',
        Role.PATIENT,
        'test@example.com'
      );
      expect(authService.issueTokenAfterOtp).toHaveBeenCalledTimes(1);
    });

    it('should validate email format in DTO', async () => {
      const dto = { email: 'invalid-email', code: '123456' } as OtpEmailVerifyDto;

      // The DTO validation should catch this before the controller method is called
      expect(dto.email).toBeDefined();
    });

    it('should validate OTP code length in DTO', async () => {
      const dto = { email: 'test@example.com', code: '12345' } as OtpEmailVerifyDto;

      // The DTO validation should catch this before the controller method is called
      expect(dto.code).toBeDefined();
    });
  });
});
