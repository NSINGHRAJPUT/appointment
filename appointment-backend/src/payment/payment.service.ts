import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BookingMode,
  NotificationType,
  Payment,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import { StripeService } from './stripe.service';
import { generateIdempotencyKey } from './utils/idempotency.util';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { VerifySessionDto } from './dto/verify-session.dto';
import {
  PaymentResponseDto,
  CheckoutSessionResponseDto,
  VerifySessionResponseDto,
  VerifySessionStatus,
  VerifySessionAppointmentDto,
} from './dto/payment-response.dto';
import { contactMatchesAppointment } from '../common/phone.util';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  private validateCheckoutRequest(
    appointment: {
      doctorId: string;
      status: AppointmentStatus;
      patientPhone?: string | null;
      patientEmail?: string | null;
      doctor: { priceCents: number };
    },
    dto: CreateCheckoutSessionDto,
  ): { amount: number; currency: string } {
    if (dto.doctorId !== appointment.doctorId) {
      throw new BadRequestException('Doctor does not match appointment');
    }
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is cancelled');
    }
    if (
      !contactMatchesAppointment(
        dto.patientIdentifier,
        appointment.patientPhone,
        appointment.patientEmail,
      )
    ) {
      throw new BadRequestException('Patient identifier does not match appointment');
    }
    const amount = appointment.doctor.priceCents;
    if (!amount || amount <= 0) {
      throw new BadRequestException('This appointment does not require payment');
    }
    return { amount, currency: dto.currency || 'INR' };
  }

  async canAccessPayment(
    appointmentId: string,
    userId: string,
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN',
  ): Promise<boolean> {
    if (role === 'ADMIN') return true;
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });
    if (!appointment) return false;
    if (role === 'DOCTOR') return appointment.doctor.userId === userId;
    if (role === 'PATIENT') return appointment.patient?.userId === userId;
    return false;
  }

  /**
   * Create a Stripe Checkout Session with idempotency
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    try {
      this.logger.log(
        `Creating checkout session for appointment ${dto.appointmentId}`,
      );

      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
        include: { doctor: true },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const { amount, currency } = this.validateCheckoutRequest(appointment, dto);

      const idempotencyKey = generateIdempotencyKey(
        dto.appointmentId,
        dto.patientIdentifier,
      );

      const existingPayment = await this.prisma.payment.findUnique({
        where: { appointmentId: dto.appointmentId },
      });

      const customerDetails = {
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail ?? undefined,
      };

      if (existingPayment) {
        if (existingPayment.status === PaymentStatus.SUCCEEDED) {
          throw new BadRequestException('Payment already completed');
        }

        if (existingPayment.status === PaymentStatus.PENDING) {
          this.logger.log(
            `Payment already exists for appointment ${dto.appointmentId}, returning existing session`,
          );
          const session = await this.stripeService.retrieveCheckoutSession(
            existingPayment.stripeSessionId,
          );
          if (session?.url && session.status === 'open') {
            return {
              sessionId: existingPayment.stripeSessionId,
              sessionUrl: session.url,
              appointmentId: dto.appointmentId,
            };
          }
        }

        const { sessionId, sessionUrl } =
          await this.stripeService.createCheckoutSession(
            dto.appointmentId,
            dto.doctorId,
            dto.patientIdentifier,
            amount,
            currency,
            `${idempotencyKey}-retry-${Date.now()}`,
            customerDetails,
          );

        await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            stripeSessionId: sessionId,
            amount,
            currency,
            status: PaymentStatus.PENDING,
            failureReason: null,
          },
        });

        return {
          sessionId,
          sessionUrl,
          appointmentId: dto.appointmentId,
        };
      }

      const { sessionId, sessionUrl } =
        await this.stripeService.createCheckoutSession(
          dto.appointmentId,
          dto.doctorId,
          dto.patientIdentifier,
          amount,
          currency,
          idempotencyKey,
          customerDetails,
        );

      await this.prisma.payment.create({
        data: {
          appointmentId: dto.appointmentId,
          stripeSessionId: sessionId,
          amount,
          currency,
          status: PaymentStatus.PENDING,
          idempotencyKey,
        },
      });

      this.logger.log(
        `Checkout session created successfully for appointment ${dto.appointmentId}`,
      );

      return {
        sessionId,
        sessionUrl,
        appointmentId: dto.appointmentId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for appointment ${dto.appointmentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verify session and confirm appointment (no webhooks)
   */
  async verifySession(dto: VerifySessionDto): Promise<VerifySessionResponseDto> {
    try {
      this.logger.log(`Verifying session ${dto.sessionId}`);

      const session = await this.stripeService.retrieveCheckoutSession(
        dto.sessionId,
      );

      if (!session) {
        throw new NotFoundException('Checkout session not found');
      }

      const appointmentId = session.metadata?.appointmentId;
      const patientIdentifier = session.metadata?.patientIdentifier;

      if (!appointmentId) {
        throw new BadRequestException(
          'Checkout session is missing appointment metadata',
        );
      }

      let payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { stripeSessionId: dto.sessionId },
            { appointmentId },
          ],
        },
      });

      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          patient: {
            include: { user: { select: { id: true, email: true } } },
          },
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (payment?.status === PaymentStatus.SUCCEEDED) {
        return this.buildVerifyResponse('SUCCEEDED', appointment, payment);
      }

      if (session.payment_status === 'paid') {
        const result = await this.confirmPaidSession(
          dto.sessionId,
          appointmentId,
          patientIdentifier ?? '',
          session,
          payment,
          appointment,
        );
        return result;
      }

      const status = this.resolveUnpaidStatus(session);
      const updatedPayment = await this.syncUnpaidPayment(
        dto.sessionId,
        appointmentId,
        patientIdentifier ?? '',
        session,
        payment,
        status,
      );

      if (
        status === 'CANCELLED' &&
        payment?.status !== PaymentStatus.CANCELLED &&
        payment?.status !== PaymentStatus.FAILED
      ) {
        const patientUserId = (
          appointment as {
            patient?: { user?: { id?: string } | null } | null;
          }
        ).patient?.user?.id;
        if (patientUserId) {
          void this.notificationService
            .createForUsers({
              userIds: [patientUserId],
              type: NotificationType.PAYMENT_FAILED,
              title: 'Payment not completed',
              body: 'Payment for your appointment was not completed.',
              linkUrl: `/appointments/${appointmentId}`,
              meta: { appointmentId },
            })
            .catch((err) =>
              this.logger.error('Failed to send payment-failed notification', err),
            );
        }
      }

      return this.buildVerifyResponse(status, appointment, updatedPayment);
    } catch (error) {
      this.logger.error(`Failed to verify session ${dto.sessionId}`, error);
      throw error;
    }
  }

  private resolveUnpaidStatus(session: {
    payment_status: string;
    status: string;
  }): VerifySessionStatus {
    if (session.status === 'expired') {
      return 'CANCELLED';
    }
    if (session.payment_status === 'unpaid' && session.status === 'open') {
      return 'PENDING';
    }
    return 'CANCELLED';
  }

  private async syncUnpaidPayment(
    sessionId: string,
    appointmentId: string,
    patientIdentifier: string,
    session: { amount_total?: number | null; currency?: string | null },
    payment: Payment | null,
    status: VerifySessionStatus,
  ): Promise<Payment> {
    const paymentStatus =
      status === 'PENDING' ? PaymentStatus.PENDING : PaymentStatus.CANCELLED;

    if (payment) {
      if (payment.status === PaymentStatus.SUCCEEDED) {
        return payment;
      }
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          failureReason:
            status === 'CANCELLED' ? 'Payment not completed' : undefined,
        },
      });
    }

    return this.prisma.payment.create({
      data: {
        appointmentId,
        stripeSessionId: sessionId,
        amount: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'INR',
        status: paymentStatus,
        failureReason:
          status === 'CANCELLED' ? 'Payment not completed' : undefined,
        idempotencyKey: generateIdempotencyKey(
          appointmentId,
          patientIdentifier,
        ),
      },
    });
  }

  private async confirmPaidSession(
    sessionId: string,
    appointmentId: string,
    patientIdentifier: string,
    session: { amount_total?: number | null; currency?: string | null },
    existingPayment: Payment | null,
    appointment: {
      doctor: { bookingMode: BookingMode; user?: { fullName?: string | null } | null } & Record<string, unknown>;
      patient?: { user?: { email?: string | null } | null } | null;
      patientEmail?: string | null;
      id: string;
    },
  ): Promise<VerifySessionResponseDto> {
    const appointmentStatus =
      appointment.doctor.bookingMode === BookingMode.INSTANT
        ? AppointmentStatus.CONFIRMED
        : AppointmentStatus.REQUESTED;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = existingPayment
        ? await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PaymentStatus.SUCCEEDED,
              stripeSessionId: sessionId,
              amount: session.amount_total || existingPayment.amount,
              currency:
                session.currency?.toUpperCase() || existingPayment.currency,
              failureReason: null,
            },
          })
        : await tx.payment.create({
            data: {
              appointmentId,
              stripeSessionId: sessionId,
              amount: session.amount_total || 0,
              currency: session.currency?.toUpperCase() || 'INR',
              status: PaymentStatus.SUCCEEDED,
              idempotencyKey: generateIdempotencyKey(
                appointmentId,
                patientIdentifier,
              ),
            },
          });

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: appointmentStatus,
          paymentStatus: PaymentStatus.SUCCEEDED,
          paymentId: updatedPayment.id,
        },
        include: {
          doctor: {
            include: {
              user: { select: { id: true, fullName: true } },
            },
          },
          patient: {
            include: {
              user: { select: { id: true, email: true } },
            },
          },
        },
      });

      return { payment: updatedPayment, appointment: updatedAppointment };
    });

    const wasAlreadyPaid = existingPayment?.status === PaymentStatus.SUCCEEDED;

    if (!wasAlreadyPaid) {
      void this.sendPaymentEmails(
        result.appointment,
        result.payment,
        result.appointment.doctor,
      ).catch((err) =>
        this.logger.error('Failed to send payment emails', err),
      );

      const recipientIds = [
        result.appointment.doctor?.user?.id,
        result.appointment.patient?.user?.id,
      ].filter((id): id is string => Boolean(id));

      void this.notificationService
        .createForUsers({
          userIds: recipientIds,
          type: NotificationType.PAYMENT_SUCCEEDED,
          title: 'Payment successful',
          body: 'Payment for your appointment was received successfully.',
          linkUrl: `/appointments/${appointmentId}`,
          meta: { appointmentId, paymentId: result.payment.id },
        })
        .catch((err) =>
          this.logger.error('Failed to send payment notifications', err),
        );
    }

    this.logger.log(
      `Session verified successfully for appointment ${appointmentId}`,
    );

    return this.buildVerifyResponse(
      'SUCCEEDED',
      result.appointment,
      result.payment,
    );
  }

  private async sendPaymentEmails(
    appointment: {
      id: string;
      patientEmail?: string | null;
      patient?: { user?: { email?: string | null } | null } | null;
    },
    payment: Payment,
    doctor: { user?: { fullName?: string | null } | null } & Record<
      string,
      unknown
    >,
  ): Promise<void> {
    await this.emailService.sendPaymentSuccess(appointment, payment, doctor);
    await this.emailService.sendAppointmentCreated(appointment, doctor);
  }

  private buildVerifyResponse(
    status: VerifySessionStatus,
    appointment: Record<string, unknown>,
    payment?: Payment | null,
  ): VerifySessionResponseDto {
    const appt = appointment as {
      id: string;
      doctorId: string;
      status: string;
      startAt: Date | string;
      endAt: Date | string;
      reason?: string | null;
      patientPhone?: string | null;
      patientEmail?: string | null;
      doctor?: {
        user?: { fullName?: string | null };
        specialization?: string | null;
        clinicName?: string | null;
      };
    };
    const minimalAppointment: VerifySessionAppointmentDto = {
      id: appt.id,
      doctorId: appt.doctorId,
      status: appt.status,
      startAt: new Date(appt.startAt).toISOString(),
      endAt: new Date(appt.endAt).toISOString(),
      reason: appt.reason ?? null,
      patientPhone: appt.patientPhone ?? null,
      patientEmail: appt.patientEmail ?? null,
      doctor: appt.doctor
        ? {
            user: appt.doctor.user
              ? { fullName: appt.doctor.user.fullName }
              : undefined,
            specialization: appt.doctor.specialization ?? null,
            clinicName: appt.doctor.clinicName ?? null,
          }
        : undefined,
    };
    return {
      status,
      appointment: minimalAppointment,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
          }
        : undefined,
    };
  }

  /**
   * Get payment details for an appointment
   */
  async getPayment(appointmentId: string): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { appointmentId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return this.mapPaymentToDto(payment);
    } catch (error) {
      this.logger.error(
        `Failed to get payment for appointment ${appointmentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * List all payments (admin)
   */
  async listPayments(filters?: {
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PaymentResponseDto[]; total: number }> {
    try {
      const limit = Math.min(filters?.limit || 50, 500);
      const offset = filters?.offset || 0;

      const where: Record<string, unknown> = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters?.startDate) {
          (where.createdAt as Record<string, Date>).gte = filters.startDate;
        }
        if (filters?.endDate) {
          (where.createdAt as Record<string, Date>).lte = filters.endDate;
        }
      }

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.count({ where }),
      ]);

      return {
        data: payments.map((p) => this.mapPaymentToDto(p)),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to list payments', error);
      throw error;
    }
  }

  private mapPaymentToDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      failureReason: payment.failureReason ?? undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
