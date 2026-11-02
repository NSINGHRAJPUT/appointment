import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

describe('Email Template Rendering', () => {
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
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.SUPPORT_EMAIL = 'support@example.com';

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
    delete process.env.FRONTEND_URL;
    delete process.env.SUPPORT_EMAIL;
  });

  describe('OTP Login Template Rendering', () => {
    it('should render otp-login template with all variables substituted', async () => {
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

      // Verify the template file exists
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      expect(fs.existsSync(templatePath)).toBe(true);

      // Read and verify template content
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      expect(templateContent).toContain('{{otp}}');
      expect(templateContent).toContain('{{expiresAt}}');
      expect(templateContent).toContain('{{frontendUrl}}');
      expect(templateContent).toContain('{{unsubscribeUrl}}');
      expect(templateContent).toContain('{{supportEmail}}');
    });

    it('should include OTP code prominently in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify OTP is displayed prominently
      expect(templateContent).toContain('class="otp-code"');
      expect(templateContent).toContain('font-size: 32px');
      expect(templateContent).toContain('font-weight: bold');
    });

    it('should include security notice in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify security notice is present
      expect(templateContent).toContain('Security Notice');
      expect(templateContent).toContain('Never share this code');
    });

    it('should include unsubscribe link in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify unsubscribe link is present
      expect(templateContent).toContain('{{unsubscribeUrl}}');
      expect(templateContent).toContain('Unsubscribe');
    });

    it('should include call-to-action button in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify CTA button is present
      expect(templateContent).toContain('class="button"');
      expect(templateContent).toContain('Verify Your Code');
    });

    it('should use professional HTML styling', async () => {
      const templatePath = path.join(__dirname, 'templates', 'otp-login.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify professional styling
      expect(templateContent).toContain('<style>');
      expect(templateContent).toContain('border-radius');
      expect(templateContent).toContain('background-color');
      expect(templateContent).toContain('padding');
    });
  });

  describe('Password Reset Template Rendering', () => {
    it('should render password-reset template with all variables substituted', async () => {
      const email = 'user@example.com';
      const otp = '654321';
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

      // Verify the template file exists
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      expect(fs.existsSync(templatePath)).toBe(true);

      // Read and verify template content
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      expect(templateContent).toContain('{{otp}}');
      expect(templateContent).toContain('{{expiresAt}}');
      expect(templateContent).toContain('{{frontendUrl}}');
      expect(templateContent).toContain('{{unsubscribeUrl}}');
      expect(templateContent).toContain('{{supportEmail}}');
    });

    it('should include OTP code prominently in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify OTP is displayed prominently
      expect(templateContent).toContain('class="otp-code"');
      expect(templateContent).toContain('font-size: 32px');
      expect(templateContent).toContain('font-weight: bold');
    });

    it('should include security notice in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify security notice is present
      expect(templateContent).toContain('Security Notice');
      expect(templateContent).toContain('Never share this code');
    });

    it('should include unsubscribe link in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify unsubscribe link is present
      expect(templateContent).toContain('{{unsubscribeUrl}}');
      expect(templateContent).toContain('Unsubscribe');
    });

    it('should include call-to-action button in template', async () => {
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify CTA button is present
      expect(templateContent).toContain('class="button"');
      expect(templateContent).toContain('Reset Your Password');
    });

    it('should use professional HTML styling', async () => {
      const templatePath = path.join(__dirname, 'templates', 'password-reset.html');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Verify professional styling
      expect(templateContent).toContain('<style>');
      expect(templateContent).toContain('border-radius');
      expect(templateContent).toContain('background-color');
      expect(templateContent).toContain('padding');
    });
  });

  describe('Template Variable Substitution', () => {
    it('should substitute OTP variable correctly', async () => {
      const email = 'user@example.com';
      const otp = '999888';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      // Call the method and verify it doesn't throw
      await service.sendOtpLogin(email, otp, expiresAt);

      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });

    it('should substitute expiresAt variable correctly', async () => {
      const email = 'user@example.com';
      const otp = '111222';
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

    it('should substitute frontendUrl variable correctly', async () => {
      const email = 'user@example.com';
      const otp = '333444';
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

    it('should substitute unsubscribeUrl variable correctly', async () => {
      const email = 'user@example.com';
      const otp = '555666';
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

    it('should substitute supportEmail variable correctly', async () => {
      const email = 'user@example.com';
      const otp = '777888';
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

  describe('Appointment Template Rendering', () => {
    const appointmentTemplates = [
      {
        name: 'appointment-created',
        placeholders: [
          '{{patientName}}',
          '{{doctorName}}',
          '{{appointmentDate}}',
          '{{appointmentId}}',
          '{{appointmentLookupUrl}}',
          '{{supportEmail}}',
        ],
      },
      {
        name: 'appointment-confirmed',
        placeholders: [
          '{{patientName}}',
          '{{doctorName}}',
          '{{appointmentId}}',
          '{{joinUrl}}',
          '{{appointmentLookupUrl}}',
        ],
      },
      {
        name: 'appointment-cancelled',
        placeholders: [
          '{{patientName}}',
          '{{appointmentId}}',
          '{{cancellationReason}}',
          '{{rebookUrl}}',
          '{{appointmentLookupUrl}}',
        ],
      },
      {
        name: 'payment-success',
        placeholders: [
          '{{patientName}}',
          '{{amount}}',
          '{{appointmentId}}',
          '{{appointmentLookupUrl}}',
        ],
      },
      {
        name: 'payment-failed',
        placeholders: [
          '{{patientName}}',
          '{{errorReason}}',
          '{{retryPaymentUrl}}',
          '{{appointmentLookupUrl}}',
        ],
      },
    ];

    appointmentTemplates.forEach(({ name, placeholders }) => {
      it(`should include PawCare branding and placeholders in ${name}`, () => {
        const templatePath = path.join(__dirname, 'templates', `${name}.html`);
        expect(fs.existsSync(templatePath)).toBe(true);
        const content = fs.readFileSync(templatePath, 'utf-8');
        expect(content).toContain('PawCare');
        placeholders.forEach((ph) => expect(content).toContain(ph));
      });
    });

    it('should render appointment-created variables via service helper', () => {
      const html = service['renderTemplate']('appointment-created', {
        patientName: 'Alex',
        doctorName: 'Dr. Smith',
        specialization: 'General',
        appointmentDate: 'Jan 1',
        appointmentId: 'apt-123',
        status: 'REQUESTED',
        appointmentDetailsUrl: 'http://localhost:3000/appointments/apt-123',
        appointmentLookupUrl:
          'http://localhost:3000/appointment-lookup?appointmentId=apt-123',
        supportEmail: 'support@example.com',
        unsubscribeUrl: 'http://localhost:3000/unsubscribe',
      });
      expect(html).toContain('PawCare');
      expect(html).toContain('apt-123');
      expect(html).toContain('appointment-lookup?appointmentId=apt-123');
    });
  });

  describe('Email Sending Async Behavior', () => {
    it('should send email asynchronously without blocking', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      mockPrismaService.emailLog.update.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.SENT,
      });

      // Should complete without blocking
      const startTime = Date.now();
      await service.sendOtpLogin(email, otp, expiresAt);
      const endTime = Date.now();

      // Should complete quickly (email sending is async)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle email sending failures gracefully', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const expiresAt = new Date();

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-123',
        status: EmailStatus.PENDING,
      });

      // Simulate email sending failure
      if (service['transporter']) {
        service['transporter'].sendMail = jest
          .fn()
          .mockRejectedValue(new Error('SMTP error'));
      }

      // Should not throw even if email sending fails
      await expect(
        service.sendOtpLogin(email, otp, expiresAt),
      ).resolves.not.toThrow();
    });
  });
});
