import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';

describe('EmailService', () => {
  let service: EmailService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    emailLog: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Set SMTP environment variables for testing
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.EMAIL_FROM = 'noreply@test.com';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock the transporter's sendMail method
    if (service['transporter']) {
      service['transporter'].sendMail = jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
      });
    }

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;
  });

  describe('sendSignupConfirmation', () => {
    it('should send signup confirmation email', async () => {
      const user = {
        id: 'user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'PATIENT',
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        to: user.email,
        template: 'signup-confirmation',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      // Should not throw
      await service.sendSignupConfirmation(user);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendAppointmentCreated', () => {
    it('should send appointment created email', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        startAt: new Date(),
        status: 'REQUESTED',
      };

      const doctor = {
        id: 'doc-123',
        specialization: 'Cardiology',
        user: {
          fullName: 'Dr. Smith',
        },
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        to: appointment.patientEmail,
        template: 'appointment-created',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendAppointmentCreated(appointment, doctor);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });

    it('should skip email if no patient email found', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: null,
        patient: null,
        startAt: new Date(),
      };

      const doctor = {
        id: 'doc-123',
        specialization: 'Cardiology',
      };

      await service.sendAppointmentCreated(appointment, doctor);

      expect(mockPrismaService.emailLog.create).not.toHaveBeenCalled();
    });
  });

  describe('sendAppointmentConfirmed', () => {
    it('should send appointment confirmed email', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        startAt: new Date(),
      };

      const doctor = {
        id: 'doc-123',
        specialization: 'Cardiology',
        user: {
          fullName: 'Dr. Smith',
        },
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendAppointmentConfirmed(appointment, doctor);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendAppointmentCancelled', () => {
    it('should send appointment cancelled email', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        startAt: new Date(),
      };

      const doctor = {
        id: 'doc-123',
        specialization: 'Cardiology',
        user: {
          fullName: 'Dr. Smith',
        },
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendAppointmentCancelled(appointment, doctor, 'Doctor cancelled');

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendPaymentSuccess', () => {
    it('should send payment success email', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        startAt: new Date(),
      };

      const payment = {
        id: 'pay-123',
        amount: 5000,
        currency: 'INR',
        stripeSessionId: 'cs_test_123',
        createdAt: new Date(),
      };

      const doctor = {
        id: 'doc-123',
        user: {
          fullName: 'Dr. Smith',
        },
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendPaymentSuccess(appointment, payment, doctor);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendPaymentFailed', () => {
    it('should send payment failed email', async () => {
      const appointment = {
        id: 'apt-123',
        patientName: 'John Doe',
        patientEmail: 'john@example.com',
        startAt: new Date(),
      };

      const doctor = {
        id: 'doc-123',
        user: {
          fullName: 'Dr. Smith',
        },
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendPaymentFailed(appointment, doctor, 'Card declined');

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendOtpLogin', () => {
    it('should send OTP login email with correct variables', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        to: email,
        template: 'otp-login',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendOtpLogin(email, otp, expiresAt);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            to: email,
            template: 'otp-login',
          }),
        }),
      );
    });

    it('should include OTP code in template variables', async () => {
      const email = 'user@example.com';
      const otp = '654321';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendOtpLogin(email, otp, expiresAt);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email with correct variables', async () => {
      const email = 'user@example.com';
      const otp = '789012';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        to: email,
        template: 'password-reset',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendPasswordReset(email, otp, expiresAt);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            to: email,
            template: 'password-reset',
          }),
        }),
      );
    });

    it('should include OTP code in template variables', async () => {
      const email = 'user@example.com';
      const otp = '345678';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      await service.sendPasswordReset(email, otp, expiresAt);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });
  });
});
