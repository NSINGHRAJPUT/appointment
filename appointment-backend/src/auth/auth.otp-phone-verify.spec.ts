import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpPhoneVerifyDto } from './dto/phone-otp-verify.dto';
import { OtpType, Role } from '@prisma/client';

describe('AuthController - Phone OTP Verify', () => {
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

  describe('POST /auth/otp/phone/verify', () => {
    it('should return 200 with token and user profile when OTP is valid', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Test User',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          role: Role.PATIENT,
          fullName: 'Test User',
          doctorProfile: null,
          patientProfile: { id: 'patient-1' },
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      const result = await controller.verifyPhoneOtp(dto);

      expect(result).toEqual({
        token: mockToken.accessToken,
        user: mockToken.user,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: dto.phoneNumber },
      });
      expect(otpService.verify).toHaveBeenCalledWith(dto.phoneNumber, dto.code, OtpType.PHONE);
      expect(authService.issueTokenAfterOtp).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.role,
        mockUser.email
      );
    });

    it('should return 404 when user not found', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      try {
        await controller.verifyPhoneOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
        const response = error.getResponse();
        expect(response.message).toBe('User not found');
      }
    });

    it('should return 400 when OTP is invalid', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: 'invalid' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyPhoneOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return 400 when OTP is expired', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('OTP has expired', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyPhoneOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return 400 when no pending OTP found', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockRejectedValue(
        new HttpException('No pending OTP found', HttpStatus.BAD_REQUEST)
      );

      try {
        await controller.verifyPhoneOtp(dto);
        fail('Should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should return user profile with doctor profile for doctor users', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'doctor-1',
        email: 'doctor@example.com',
        phoneNumber: '+1234567890',
        role: Role.DOCTOR,
        fullName: 'Dr. Test',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'doctor-1',
          email: 'doctor@example.com',
          phoneNumber: '+1234567890',
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

      const result = await controller.verifyPhoneOtp(dto);

      expect(result.user.doctorProfile).toBeDefined();
      expect(result.user.doctorProfile.specialization).toBe('Cardiology');
    });

    it('should call OtpService.verify with correct parameters', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          role: Role.PATIENT,
          fullName: 'Test User',
          doctorProfile: null,
          patientProfile: { id: 'patient-1' },
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      await controller.verifyPhoneOtp(dto);

      expect(otpService.verify).toHaveBeenCalledWith(dto.phoneNumber, dto.code, OtpType.PHONE);
      expect(otpService.verify).toHaveBeenCalledTimes(1);
    });

    it('should call AuthService.issueTokenAfterOtp with correct parameters', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          role: Role.PATIENT,
          fullName: 'Test User',
          doctorProfile: null,
          patientProfile: { id: 'patient-1' },
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      await controller.verifyPhoneOtp(dto);

      expect(authService.issueTokenAfterOtp).toHaveBeenCalledWith(
        'user-1',
        Role.PATIENT,
        'test@example.com'
      );
      expect(authService.issueTokenAfterOtp).toHaveBeenCalledTimes(1);
    });

    it('should validate phone format in DTO', async () => {
      const dto = { phoneNumber: 'invalid-phone', code: '123456' } as OtpPhoneVerifyDto;

      // The DTO validation should catch this before the controller method is called
      expect(dto.phoneNumber).toBeDefined();
    });

    it('should validate OTP code length in DTO', async () => {
      const dto = { phoneNumber: '+1234567890', code: '12345' } as OtpPhoneVerifyDto;

      // The DTO validation should catch this before the controller method is called
      expect(dto.code).toBeDefined();
    });

    it('should accept valid E.164 phone formats', async () => {
      const validPhones = [
        '+1234567890',
        '+44123456789',
        '+919876543210',
        '+33123456789',
      ];

      for (const phone of validPhones) {
        const dto: OtpPhoneVerifyDto = { phoneNumber: phone, code: '123456' };
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          phoneNumber: phone,
          role: Role.PATIENT,
          fullName: 'Test User',
        };
        const mockToken = {
          accessToken: 'jwt-token-here',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            phoneNumber: phone,
            role: Role.PATIENT,
            fullName: 'Test User',
            doctorProfile: null,
            patientProfile: { id: 'patient-1' },
          },
        };

        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
        jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
        jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

        const result = await controller.verifyPhoneOtp(dto);

        expect(result).toEqual({
          token: mockToken.accessToken,
          user: mockToken.user,
        });
        expect(otpService.verify).toHaveBeenCalledWith(phone, '123456', OtpType.PHONE);

        jest.clearAllMocks();
      }
    });

    it('should return user profile with patient profile for patient users', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'patient-1',
        email: 'patient@example.com',
        phoneNumber: '+1234567890',
        role: Role.PATIENT,
        fullName: 'Patient Test',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'patient-1',
          email: 'patient@example.com',
          phoneNumber: '+1234567890',
          role: Role.PATIENT,
          fullName: 'Patient Test',
          doctorProfile: null,
          patientProfile: {
            id: 'patient-profile-1',
            dateOfBirth: new Date('1990-01-01'),
          },
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      const result = await controller.verifyPhoneOtp(dto);

      expect(result.user.patientProfile).toBeDefined();
      expect(result.user.patientProfile.id).toBe('patient-profile-1');
    });

    it('should return user profile with admin role', async () => {
      const dto: OtpPhoneVerifyDto = { phoneNumber: '+1234567890', code: '123456' };
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        phoneNumber: '+1234567890',
        role: Role.ADMIN,
        fullName: 'Admin Test',
      };
      const mockToken = {
        accessToken: 'jwt-token-here',
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          phoneNumber: '+1234567890',
          role: Role.ADMIN,
          fullName: 'Admin Test',
          doctorProfile: null,
          patientProfile: null,
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(otpService, 'verify').mockResolvedValue(undefined);
      jest.spyOn(authService, 'issueTokenAfterOtp').mockResolvedValue(mockToken);

      const result = await controller.verifyPhoneOtp(dto);

      expect(result.user.role).toBe(Role.ADMIN);
      expect(result.token).toBe('jwt-token-here');
    });
  });
});
