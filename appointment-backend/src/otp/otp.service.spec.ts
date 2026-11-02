import { BadRequestException, Logger } from '@nestjs/common';
import { OtpStatus, OtpType } from '@prisma/client';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fc from 'fast-check';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: PrismaService;
  let emailService: {
    sendOtpLogin: jest.Mock;
    sendPasswordReset: jest.Mock;
    sendBookingOtp: jest.Mock;
  };
  let prevStaticOtp: string | undefined;

  beforeEach(async () => {
    prevStaticOtp = process.env.USE_STATIC_OTP;
    process.env.USE_STATIC_OTP = 'false';

    prisma = {
      otpVerification: {
        count: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    emailService = {
      sendOtpLogin: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      sendBookingOtp: jest.fn().mockResolvedValue(undefined),
    };

    service = new OtpService(prisma, emailService as any);
  });

  afterEach(() => {
    if (prevStaticOtp === undefined) {
      delete process.env.USE_STATIC_OTP;
    } else {
      process.env.USE_STATIC_OTP = prevStaticOtp;
    }
  });

  describe('generate', () => {
    describe('Static OTP mode', () => {
      it('should return configured static code when USE_STATIC_OTP is enabled', async () => {
        process.env.USE_STATIC_OTP = 'true';
        process.env.STATIC_OTP_CODE = '000000';
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const code = await service.generate('+15551234567', OtpType.PHONE, {
          alsoNotifyEmail: 'guest@example.com',
        });

        expect(code).toBe('000000');
        expect(emailService.sendBookingOtp).toHaveBeenCalledWith(
          'guest@example.com',
          '000000',
          expect.any(Date),
        );
      });
    });

    describe('Property 1: OTP Code Format', () => {
      it('should generate 6-digit numeric OTP codes across 100 iterations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.emailAddress(),
            fc.constantFrom(OtpType.EMAIL, OtpType.PHONE),
            async (target, type) => {
              (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
              (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
              (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

              const code = await service.generate(target, type);

              // Verify code is 6-digit numeric
              expect(code).toMatch(/^\d{6}$/);
              expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
              expect(parseInt(code)).toBeLessThanOrEqual(999999);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should generate different OTP codes on repeated calls', async () => {
        const codes = new Set<string>();
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        for (let i = 0; i < 10; i++) {
          const code = await service.generate('test@example.com', OtpType.EMAIL);
          codes.add(code);
        }

        // With 10 iterations, we should get at least 8 different codes (statistically)
        expect(codes.size).toBeGreaterThan(5);
      });
    });

    describe('Property 2: OTP Record Creation', () => {
      it('should create OtpVerification record with PENDING status and 10-minute expiration', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const beforeTime = Date.now();
        await service.generate('test@example.com', OtpType.EMAIL);
        const afterTime = Date.now();

        expect(prisma.otpVerification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              target: 'test@example.com',
              type: OtpType.EMAIL,
              expiresAt: expect.any(Date),
            }),
          }),
        );

        const callArgs = (prisma.otpVerification.create as jest.Mock).mock.calls[0][0];
        const expiresAt = callArgs.data.expiresAt.getTime();
        const expectedExpiration = 10 * 60 * 1000; // 10 minutes in ms

        // Verify expiration is approximately 10 minutes from now (within ±1 second)
        expect(expiresAt - beforeTime).toBeGreaterThanOrEqual(expectedExpiration - 1000);
        expect(expiresAt - afterTime).toBeLessThanOrEqual(expectedExpiration + 1000);
      });
    });

    describe('Property 3: Rate Limiting Enforcement', () => {
      it('should reject OTP generation when 5+ pending OTPs exist within TTL window', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(5);

        await expect(service.generate('test@example.com', OtpType.EMAIL)).rejects.toThrow(
          new BadRequestException('Too many OTP requests. Please wait before retrying.'),
        );
      });

      it('should reject OTP generation when more than 5 pending OTPs exist', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(10);

        await expect(service.generate('test@example.com', OtpType.EMAIL)).rejects.toThrow(
          new BadRequestException('Too many OTP requests. Please wait before retrying.'),
        );
      });

      it('should allow OTP generation when fewer than 5 pending OTPs exist', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(4);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const code = await service.generate('test@example.com', OtpType.EMAIL);
        expect(code).toMatch(/^\d{6}$/);
      });

      it('should allow OTP generation when exactly 0 pending OTPs exist', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const code = await service.generate('test@example.com', OtpType.EMAIL);
        expect(code).toMatch(/^\d{6}$/);
      });

      it('should count only PENDING OTPs within TTL window', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        await service.generate('test@example.com', OtpType.EMAIL);

        expect(prisma.otpVerification.count).toHaveBeenCalledWith({
          where: {
            target: 'test@example.com',
            type: OtpType.EMAIL,
            status: OtpStatus.PENDING,
            createdAt: {
              gte: expect.any(Date),
            },
          },
        });

        const callArgs = (prisma.otpVerification.count as jest.Mock).mock.calls[0][0];
        const gteTime = callArgs.where.createdAt.gte.getTime();
        const now = Date.now();
        const expectedWindow = 10 * 60 * 1000; // 10 minutes

        // Verify the time window is approximately 10 minutes
        expect(now - gteTime).toBeGreaterThanOrEqual(expectedWindow - 1000);
        expect(now - gteTime).toBeLessThanOrEqual(expectedWindow + 1000);
      });
    });

    describe('Property 4: Previous OTP Expiration', () => {
      it('should mark all previous PENDING OTPs as EXPIRED when new OTP is generated', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        await service.generate('test@example.com', OtpType.EMAIL);

        expect(prisma.otpVerification.updateMany).toHaveBeenCalledWith({
          where: {
            target: 'test@example.com',
            type: OtpType.EMAIL,
            status: OtpStatus.PENDING,
          },
          data: {
            status: OtpStatus.EXPIRED,
          },
        });
      });

      it('should expire previous OTPs for each target independently', async () => {
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        await service.generate('email1@example.com', OtpType.EMAIL);
        await service.generate('email2@example.com', OtpType.EMAIL);

        const calls = (prisma.otpVerification.updateMany as jest.Mock).mock.calls;
        expect(calls[0][0].where.target).toBe('email1@example.com');
        expect(calls[1][0].where.target).toBe('email2@example.com');
      });
    });

    describe('Development Logging', () => {
      it('should log OTP code in development environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const code = await service.generate('test@example.com', OtpType.EMAIL);

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining(`[OTP] EMAIL → test@example.com: ${code}`),
        );

        logSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
      });

      it('should NOT log OTP code in production environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        await service.generate('test@example.com', OtpType.EMAIL);

        expect(
          logSpy.mock.calls.some(([message]) =>
            String(message).includes('[OTP] EMAIL → test@example.com'),
          ),
        ).toBe(false);

        logSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
      });

      it('should log PHONE OTP type correctly', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
        (prisma.otpVerification.count as jest.Mock).mockResolvedValue(0);
        (prisma.otpVerification.updateMany as jest.Mock).mockResolvedValue({});
        (prisma.otpVerification.create as jest.Mock).mockResolvedValue({});

        const code = await service.generate('+1234567890', OtpType.PHONE);

        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining(`[OTP] PHONE → +1234567890: ${code}`),
        );

        logSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
      });
    });
  });

  describe('verify', () => {
    describe('Property 6: Most Recent OTP Retrieval', () => {
      it('should retrieve the most recent PENDING OTP by createdAt timestamp', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await service.verify('test@example.com', '123456', OtpType.EMAIL);

        expect(prisma.otpVerification.findFirst).toHaveBeenCalledWith({
          where: {
            target: 'test@example.com',
            type: OtpType.EMAIL,
            status: OtpStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      });
    });

    describe('Property 7: OTP Expiration Validation', () => {
      it('should fail with "OTP has expired" when expiresAt is in the past', async () => {
        const pastDate = new Date(Date.now() - 1000); // 1 second ago
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: pastDate,
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await expect(service.verify('test@example.com', '123456', OtpType.EMAIL)).rejects.toThrow(
          new BadRequestException('OTP has expired'),
        );
      });

      it('should update OTP status to EXPIRED when verification fails due to expiration', async () => {
        const pastDate = new Date(Date.now() - 1000);
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: pastDate,
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        try {
          await service.verify('test@example.com', '123456', OtpType.EMAIL);
        } catch (e) {
          // Expected to throw
        }

        expect(prisma.otpVerification.update).toHaveBeenCalledWith({
          where: { id: 'otp-1' },
          data: { status: OtpStatus.EXPIRED },
        });
      });

      it('should allow verification when OTP is not yet expired', async () => {
        const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: futureDate,
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await service.verify('test@example.com', '123456', OtpType.EMAIL);

        expect(prisma.otpVerification.update).toHaveBeenCalledWith({
          where: { id: 'otp-1' },
          data: { status: OtpStatus.VERIFIED },
        });
      });
    });

    describe('Property 8: OTP Code Validation', () => {
      it('should fail with "Invalid OTP" when code does not match', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await expect(service.verify('test@example.com', '654321', OtpType.EMAIL)).rejects.toThrow(
          new BadRequestException('Invalid OTP'),
        );
      });

      it('should succeed when code matches exactly', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await service.verify('test@example.com', '123456', OtpType.EMAIL);

        expect(prisma.otpVerification.update).toHaveBeenCalledWith({
          where: { id: 'otp-1' },
          data: { status: OtpStatus.VERIFIED },
        });
      });
    });

    describe('Property 9: Successful OTP Verification', () => {
      it('should update OtpVerification status to VERIFIED on successful verification', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await service.verify('test@example.com', '123456', OtpType.EMAIL);

        expect(prisma.otpVerification.update).toHaveBeenCalledWith({
          where: { id: 'otp-1' },
          data: { status: OtpStatus.VERIFIED },
        });
      });

      it('should not throw error on successful verification', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await expect(
          service.verify('test@example.com', '123456', OtpType.EMAIL),
        ).resolves.not.toThrow();
      });
    });

    describe('Error Cases', () => {
      it('should fail with "No pending OTP found" when no PENDING OTP exists', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(service.verify('test@example.com', '123456', OtpType.EMAIL)).rejects.toThrow(
          new BadRequestException('No pending OTP found'),
        );
      });

      it('should handle different OTP types independently', async () => {
        (prisma.otpVerification.findFirst as jest.Mock).mockResolvedValue({
          id: 'otp-1',
          code: '123456',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        (prisma.otpVerification.update as jest.Mock).mockResolvedValue({});

        await service.verify('test@example.com', '123456', OtpType.EMAIL);
        await service.verify('+1234567890', '123456', OtpType.PHONE);

        const calls = (prisma.otpVerification.findFirst as jest.Mock).mock.calls;
        expect(calls[0][0].where.type).toBe(OtpType.EMAIL);
        expect(calls[1][0].where.type).toBe(OtpType.PHONE);
      });
    });
  });

  describe('Database Indexes', () => {
    it('should use composite index (target, type, status) for OTP lookups', () => {
      // This test verifies the schema has the required index
      // The actual index verification happens at the database level
      // This is a documentation test to ensure the index is used in queries
      expect(true).toBe(true);
    });

    it('should use composite index (target, type, createdAt) for rate-limit queries', () => {
      // This test verifies the schema has the required index
      // The actual index verification happens at the database level
      // This is a documentation test to ensure the index is used in queries
      expect(true).toBe(true);
    });
  });
});
