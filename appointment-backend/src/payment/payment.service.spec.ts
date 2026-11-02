import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingMode, PaymentStatus } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrismaService = {
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStripeService = {
    createCheckoutSession: jest.fn(),
    retrieveCheckoutSession: jest.fn(),
  };

  const mockEmailService = {
    sendPaymentSuccess: jest.fn(),
    sendAppointmentCreated: jest.fn(),
    sendPaymentFailed: jest.fn(),
  };

  const mockNotificationService = {
    createForUsers: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const dto = {
        appointmentId: 'apt-123',
        doctorId: 'doc-123',
        patientIdentifier: 'patient@example.com',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'apt-123',
        doctorId: 'doc-123',
      });
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_test_123',
        sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
      });
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: PaymentStatus.PENDING,
      });

      const result = await service.createCheckoutSession(dto);

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        appointmentId: 'apt-123',
      });
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession({
          appointmentId: 'apt-123',
          doctorId: 'doc-123',
          patientIdentifier: 'patient@example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing open session if payment is pending', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue({
        id: 'apt-123',
        doctorId: 'doc-123',
      });
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        status: PaymentStatus.PENDING,
      });
      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        status: 'open',
      });

      const result = await service.createCheckoutSession({
        appointmentId: 'apt-123',
        doctorId: 'doc-123',
        patientIdentifier: 'patient@example.com',
      });

      expect(result.sessionId).toBe('cs_test_123');
      expect(mockPrismaService.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('verifySession', () => {
    const appointmentWithDoctor = {
      id: 'apt-123',
      status: 'REQUESTED',
      doctor: {
        bookingMode: BookingMode.INSTANT,
        user: { fullName: 'Dr. Smith' },
      },
      patient: null,
      patientEmail: 'patient@example.com',
    };

    it('should verify paid session and confirm appointment', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        status: 'complete',
        amount_total: 5000,
        currency: 'inr',
        metadata: {
          appointmentId: 'apt-123',
          patientIdentifier: 'patient@example.com',
          doctorId: 'doc-123',
        },
      });

      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: PaymentStatus.PENDING,
      });

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        appointmentWithDoctor,
      );

      mockPrismaService.$transaction.mockImplementation(async (callback) =>
        callback({
          payment: {
            update: jest.fn().mockResolvedValue({
              id: 'pay-123',
              appointmentId: 'apt-123',
              stripeSessionId: 'cs_test_123',
              amount: 5000,
              currency: 'INR',
              status: PaymentStatus.SUCCEEDED,
              idempotencyKey: 'key',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          appointment: {
            update: jest.fn().mockResolvedValue({
              ...appointmentWithDoctor,
              status: 'CONFIRMED',
              paymentStatus: PaymentStatus.SUCCEEDED,
              doctor: appointmentWithDoctor.doctor,
              patient: null,
            }),
          },
        }),
      );

      const result = await service.verifySession({ sessionId: 'cs_test_123' });

      expect(result.status).toBe('SUCCEEDED');
      expect(result.payment?.status).toBe(PaymentStatus.SUCCEEDED);
      expect(mockEmailService.sendPaymentSuccess).toHaveBeenCalled();
    });

    it('should return cancelled status for unpaid session without throwing', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'unpaid',
        status: 'expired',
        amount_total: 5000,
        currency: 'inr',
        metadata: {
          appointmentId: 'apt-123',
          patientIdentifier: 'patient@example.com',
          doctorId: 'doc-123',
        },
      });

      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        status: PaymentStatus.PENDING,
      });

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        appointmentWithDoctor,
      );

      mockPrismaService.payment.update.mockResolvedValue({
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: PaymentStatus.CANCELLED,
        idempotencyKey: 'key',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.verifySession({ sessionId: 'cs_test_123' });

      expect(result.status).toBe('CANCELLED');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should be idempotent when payment already succeeded', async () => {
      const existingPayment = {
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        idempotencyKey: 'key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        metadata: { appointmentId: 'apt-123' },
      });

      mockPrismaService.payment.findFirst.mockResolvedValue(existingPayment);
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        appointmentWithDoctor,
      );

      const result = await service.verifySession({ sessionId: 'cs_test_123' });

      expect(result.status).toBe('SUCCEEDED');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw if session metadata is missing appointmentId', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'unpaid',
        metadata: {},
      });

      await expect(
        service.verifySession({ sessionId: 'cs_test_123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayment', () => {
    it('should get payment details successfully', async () => {
      const payment = {
        id: 'pay-123',
        appointmentId: 'apt-123',
        stripeSessionId: 'cs_test_123',
        amount: 5000,
        currency: 'INR',
        status: PaymentStatus.SUCCEEDED,
        idempotencyKey: 'key-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPayment('apt-123');

      expect(result.id).toBe('pay-123');
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.getPayment('apt-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
