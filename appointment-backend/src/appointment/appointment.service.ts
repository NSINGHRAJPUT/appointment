import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BookingMode,
  DoctorApprovalStatus,
  NotificationType,
  OtpType,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import {
  isValidIndianMobile,
  maskEmail,
  maskIndianMobile,
  normalizeIndianMobile,
  phoneLookupDbValues,
} from '../common/phone.util';

export interface GuestBookingInput {
  doctorId: string;
  startAt: string;
  endAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  otpCode: string;
  otpTarget: string;
  otpType: OtpType;
  reason?: string;
  isInstant?: boolean;
}

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  private formatWhen(date: Date): string {
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private async notifyAppointmentParties(
    appointmentId: string,
    opts: {
      type: NotificationType;
      titleForPatient: string;
      titleForDoctor: string;
      body: string;
      includePatient?: boolean;
      includeDoctor?: boolean;
    },
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });
    if (!appointment) return;

    const linkUrl = `/appointments/${appointment.id}`;
    const includePatient = opts.includePatient !== false;
    const includeDoctor = opts.includeDoctor !== false;

    if (includeDoctor && appointment.doctor.userId) {
      void this.notificationService
        .createForUsers({
          userIds: [appointment.doctor.userId],
          type: opts.type,
          title: opts.titleForDoctor,
          body: opts.body,
          linkUrl,
          meta: {
            appointmentId: appointment.id,
            isInstant: Boolean((appointment as { isInstant?: boolean }).isInstant),
          },
        })
        .catch(() => undefined);
    }

    if (includePatient && appointment.patient?.userId) {
      void this.notificationService
        .createForUsers({
          userIds: [appointment.patient.userId],
          type: opts.type,
          title: opts.titleForPatient,
          body: opts.body,
          linkUrl,
          meta: {
            appointmentId: appointment.id,
            isInstant: Boolean((appointment as { isInstant?: boolean }).isInstant),
          },
        })
        .catch(() => undefined);
    }
  }

  private parseTimeToMinutes(timeHHmm: string): number {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeHHmm);
    if (!m) throw new BadRequestException('Invalid time format');
    return Number(m[1]) * 60 + Number(m[2]);
  }

  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  private dayOfWeek(date: Date): number {
    return date.getDay();
  }

  private sameLocalDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private formatLocalHHmm(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private async sendBookingEmailIfPresent(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    if (!appointment) return;

    const patientEmail =
      appointment.patientEmail?.trim() ||
      appointment.patient?.user?.email?.trim();
    if (!patientEmail) return;

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: appointment.doctorId },
      include: { user: { select: { fullName: true } } },
    });
    if (!doctor) return;

    await this.emailService.sendAppointmentCreated(appointment, doctor);
  }

  /** Authenticated patient booking (preserves existing behaviour) */
  async book(
    patientUserId: string,
    doctorId: string,
    startAt: string,
    endAt: string,
    reason?: string,
    isInstant = false,
  ) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException('Invalid appointment time range');
    }

    const appointment = await this.prisma.$transaction(async (tx) => {
      const patient = await tx.patientProfile.findUnique({
        where: { userId: patientUserId },
        include: {
          user: { select: { fullName: true, phoneNumber: true, email: true } },
        },
      });
      if (!patient)
        throw new BadRequestException('Only patients can book appointments');

      const doctor = await tx.doctorProfile.findUnique({
        where: { id: doctorId },
      });
      if (!doctor) throw new BadRequestException('Doctor not found');
      if (doctor.onboardingStatus !== DoctorApprovalStatus.APPROVED)
        throw new ForbiddenException('Doctor not approved');

      if (isInstant && doctor.bookingMode !== BookingMode.INSTANT) {
        throw new BadRequestException(
          'Doctor is not available for instant consult',
        );
      }
      if (isInstant && !doctor.isOnline) {
        throw new BadRequestException(
          'Doctor is not available for instant consult',
        );
      }

      await this.validateSlot(tx, doctorId, start, end);

      const requiresPayment = doctor.priceCents > 0;
      const status = requiresPayment
        ? AppointmentStatus.REQUESTED
        : isInstant || doctor.bookingMode === BookingMode.INSTANT
          ? AppointmentStatus.CONFIRMED
          : AppointmentStatus.REQUESTED;

      try {
        return await tx.appointment.create({
          data: {
            patientId: patient.id,
            doctorId,
            patientName: patient.user.fullName,
            patientPhone: patient.user.phoneNumber ?? '',
            patientEmail: patient.user.email ?? undefined,
            startAt: start,
            endAt: end,
            reason,
            status,
            isInstant,
            conversation: { create: {} },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          throw new ConflictException('Selected slot is not available');
        }
        throw err;
      }
    });

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { priceCents: true },
    });

    if (!doctor?.priceCents || doctor.priceCents <= 0) {
      void this.sendBookingEmailIfPresent(appointment.id).catch((err) =>
        console.error('Failed to send appointment booking email:', err),
      );
    }

    const isRequested = appointment.status === AppointmentStatus.REQUESTED;
    const when = this.formatWhen(appointment.startAt);
    void this.notifyAppointmentParties(appointment.id, {
      type: isRequested
        ? NotificationType.APPOINTMENT_REQUESTED
        : NotificationType.APPOINTMENT_BOOKED,
      titleForDoctor: isRequested
        ? 'New appointment request'
        : 'New appointment booked',
      titleForPatient: isRequested
        ? 'Appointment requested'
        : 'Appointment booked',
      body: isRequested
        ? `Appointment with ${appointment.patientName} on ${when} is awaiting confirmation.`
        : `Appointment scheduled for ${when}.`,
    });

    return appointment;
  }

  /** Guest booking — no account required, OTP verified */
  async bookAsGuest(input: GuestBookingInput) {
    if (!isValidIndianMobile(input.patientPhone)) {
      throw new BadRequestException(
        'Phone must be a valid 10-digit Indian mobile number',
      );
    }
    input.patientPhone = normalizeIndianMobile(input.patientPhone);

    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException('Invalid appointment time range');
    }

    await this.otpService.verify(input.otpTarget, input.otpCode, input.otpType);

    const appointment = await this.prisma.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.findUnique({
        where: { id: input.doctorId },
      });
      if (!doctor) throw new BadRequestException('Doctor not found');
      if (doctor.onboardingStatus !== DoctorApprovalStatus.APPROVED)
        throw new ForbiddenException('Doctor not approved');

      const isInstant = input.isInstant ?? false;

      if (isInstant && doctor.bookingMode !== BookingMode.INSTANT) {
        throw new BadRequestException(
          'Doctor is not available for instant consult',
        );
      }

      if (isInstant && !doctor.isOnline)
        throw new BadRequestException(
          'Doctor is not available for instant consult',
        );

      await this.validateSlot(tx, input.doctorId, start, end);

      const requiresPayment = doctor.priceCents > 0;
      const status = requiresPayment
        ? AppointmentStatus.REQUESTED
        : isInstant
          ? AppointmentStatus.CONFIRMED
          : doctor.bookingMode === BookingMode.INSTANT
            ? AppointmentStatus.CONFIRMED
            : AppointmentStatus.REQUESTED;

      try {
        return await tx.appointment.create({
          data: {
            doctorId: input.doctorId,
            patientName: input.patientName,
            patientPhone: input.patientPhone,
            patientEmail: input.patientEmail,
            startAt: start,
            endAt: end,
            reason: input.reason,
            status,
            isInstant: input.isInstant ?? false,
            conversation: { create: {} },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          throw new ConflictException('Selected slot is not available');
        }
        throw err;
      }
    });

    if (appointment) {
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { id: input.doctorId },
        select: { priceCents: true },
      });
      if (!doctor?.priceCents || doctor.priceCents <= 0) {
        void this.sendBookingEmailIfPresent(appointment.id).catch((err) =>
          console.error('Failed to send appointment booking email:', err),
        );
      }

      const isRequested = appointment.status === AppointmentStatus.REQUESTED;
      const when = this.formatWhen(appointment.startAt);
      void this.notifyAppointmentParties(appointment.id, {
        type: isRequested
          ? NotificationType.APPOINTMENT_REQUESTED
          : NotificationType.APPOINTMENT_BOOKED,
        titleForDoctor: isRequested
          ? 'New appointment request'
          : 'New appointment booked',
        titleForPatient: isRequested
          ? 'Appointment requested'
          : 'Appointment booked',
        body: isRequested
          ? `Guest booking from ${appointment.patientName} on ${when} is awaiting confirmation.`
          : `Guest appointment with ${appointment.patientName} scheduled for ${when}.`,
        includePatient: false,
      });
    }

    return appointment;
  }

  private async validateSlot(
    tx: any,
    doctorId: string,
    start: Date,
    end: Date,
  ) {
    if (!this.sameLocalDay(start, end)) {
      throw new BadRequestException(
        'Appointments must start and end on the same day',
      );
    }

    const day = this.dayOfWeek(start);
    const startHHmm = this.formatLocalHHmm(start);
    const endHHmm = this.formatLocalHHmm(end);

    await tx.$executeRaw`SELECT id FROM "DoctorProfile" WHERE id = ${doctorId} FOR UPDATE`;

    const availability = await tx.availability.findFirst({
      where: {
        doctorId,
        isActive: true,
        dayOfWeek: day,
        startTime: { lte: startHHmm },
        endTime: { gte: endHHmm },
      },
    });
    if (!availability)
      throw new BadRequestException('Doctor not available for selected day');

    const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMins !== availability.slotMins) {
      throw new BadRequestException(
        'Selected slot does not match doctor availability',
      );
    }

    const availabilityStartMins = this.parseTimeToMinutes(
      availability.startTime,
    );
    const requestedStartMins = this.parseTimeToMinutes(startHHmm);
    if (
      (requestedStartMins - availabilityStartMins) % availability.slotMins !==
      0
    ) {
      throw new BadRequestException(
        'Selected slot is not aligned with doctor availability',
      );
    }

    const overlap = await tx.appointment.findFirst({
      where: {
        doctorId,
        status: {
          in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED],
        },
        startAt: { lt: end },
        endAt: { gt: start },
      },
      select: { id: true },
    });
    if (overlap)
      throw new BadRequestException('Selected slot is not available');
  }

  async updateStatus(
    userId: string,
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN',
    appointmentId: string,
    status: AppointmentStatus,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { userId: true, priceCents: true } },
        patient: { select: { userId: true } },
        payment: { select: { status: true } },
      },
    });
    if (!appointment) throw new BadRequestException('Appointment not found');

    const isDoctor = appointment.doctor.userId === userId;
    const isPatient = appointment.patient?.userId === userId;

    if (role === 'ADMIN') {
      // allow all transitions
    } else if (role === 'DOCTOR') {
      if (!isDoctor) throw new ForbiddenException('Not your appointment');
      const allowed: AppointmentStatus[] = [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ];
      if (!allowed.includes(status))
        throw new ForbiddenException('Doctor cannot set this status');
    } else if (role === 'PATIENT') {
      if (!isPatient) throw new ForbiddenException('Not your appointment');
      if (status !== AppointmentStatus.CANCELLED)
        throw new ForbiddenException('Patient can only cancel');
    }

    const current = appointment.status;
    if (
      status === AppointmentStatus.CONFIRMED &&
      current !== AppointmentStatus.REQUESTED
    ) {
      throw new BadRequestException(
        'Only requested appointments can be confirmed',
      );
    }
    if (
      status === AppointmentStatus.CONFIRMED &&
      appointment.doctor.priceCents > 0 &&
      appointment.payment?.status !== PaymentStatus.SUCCEEDED
    ) {
      throw new BadRequestException(
        'Payment must be completed before confirming this appointment',
      );
    }
    if (
      status === AppointmentStatus.COMPLETED &&
      current !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only confirmed appointments can be completed',
      );
    }
    const cancellable: AppointmentStatus[] = [
      AppointmentStatus.REQUESTED,
      AppointmentStatus.CONFIRMED,
    ];
    if (
      status === AppointmentStatus.CANCELLED &&
      !cancellable.includes(current)
    ) {
      throw new BadRequestException(
        'Cannot cancel completed/cancelled appointment',
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    const when = this.formatWhen(updated.startAt);
    if (status === AppointmentStatus.CONFIRMED) {
      void this.notifyAppointmentParties(appointmentId, {
        type: NotificationType.APPOINTMENT_CONFIRMED,
        titleForPatient: 'Appointment confirmed',
        titleForDoctor: 'Appointment confirmed',
        body: `Appointment on ${when} has been confirmed.`,
      });
    } else if (status === AppointmentStatus.CANCELLED) {
      void this.notifyAppointmentParties(appointmentId, {
        type: NotificationType.APPOINTMENT_CANCELLED,
        titleForPatient: 'Appointment cancelled',
        titleForDoctor: 'Appointment cancelled',
        body: `Appointment on ${when} has been cancelled.`,
      });
    } else if (status === AppointmentStatus.COMPLETED) {
      void this.notifyAppointmentParties(appointmentId, {
        type: NotificationType.APPOINTMENT_COMPLETED,
        titleForPatient: 'Appointment completed',
        titleForDoctor: 'Appointment completed',
        body: `Appointment on ${when} has been marked completed.`,
      });
    }

    return updated;
  }

  /**
   * Confirm appointment after payment verification
   */
  async confirmAppointmentAfterPayment(
    appointmentId: string,
    paymentId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new BadRequestException('Appointment not found');
      }

      if (appointment.status !== AppointmentStatus.REQUESTED) {
        throw new BadRequestException(
          'Only requested appointments can be confirmed',
        );
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CONFIRMED,
          paymentStatus: 'SUCCEEDED',
          paymentId,
        },
      });
    });
  }

  myAppointments(userId: string, role: 'PATIENT' | 'DOCTOR' | 'ADMIN') {
    if (role === 'PATIENT') {
      return this.prisma.appointment.findMany({
        where: { patient: { userId } },
        include: {
          conversation: { select: { id: true } },
          doctor: {
            select: {
              id: true,
              specialization: true,
              user: {
                select: { id: true, fullName: true, whatsappNumber: true },
              },
            },
          },
        },
      });
    }
    if (role === 'DOCTOR') {
      return this.prisma.appointment.findMany({
        where: { doctor: { userId } },
        include: {
          conversation: { select: { id: true } },
          patient: {
            select: {
              id: true,
              user: {
                select: { id: true, fullName: true, whatsappNumber: true },
              },
            },
          },
        },
      });
    }
    return this.prisma.appointment.findMany({
      include: {
        conversation: { select: { id: true } },
        patient: {
          select: {
            id: true,
            user: {
              select: { id: true, fullName: true, whatsappNumber: true },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: {
              select: { id: true, fullName: true, whatsappNumber: true },
            },
          },
        },
      },
    });
  }

  async getById(
    appointmentId: string,
    userId: string,
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN',
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        conversation: { select: { id: true } },
        patient: {
          select: {
            id: true,
            user: {
              select: { id: true, fullName: true, whatsappNumber: true },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            priceCents: true,
            user: {
              select: { id: true, fullName: true, whatsappNumber: true },
            },
          },
        },
      },
    });

    if (!appointment) throw new BadRequestException('Appointment not found');

    // Authorization: allow if user is the doctor, patient, or admin
    if (role === 'PATIENT' && appointment.patient?.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this appointment',
      );
    }
    if (role === 'DOCTOR' && appointment.doctor?.user?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this appointment',
      );
    }

    return appointment;
  }

  async publicLookup(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new BadRequestException(
        'Enter an appointment ID, mobile number, or email.',
      );
    }

    const appointments = await this.findAppointmentsForPublicLookup(trimmed);
    if (!appointments.length) {
      throw new BadRequestException(
        'No appointment found for these details. Please check your appointment ID, mobile number, or email.',
      );
    }

    return {
      appointments: appointments.map((appointment) =>
        this.toPublicLookupResult(appointment),
      ),
    };
  }

  private readonly publicLookupInclude = {
    doctor: {
      select: {
        specialization: true,
        clinicName: true,
        user: { select: { fullName: true } },
      },
    },
    payment: { select: { status: true } },
  } as const;

  private async findAppointmentsForPublicLookup(query: string) {
    if (query.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) {
        throw new BadRequestException('Enter a valid email address.');
      }

      const appointments = await this.prisma.appointment.findMany({
        where: {
          patientEmail: { equals: query.trim(), mode: 'insensitive' },
        },
        include: this.publicLookupInclude,
        take: 20,
      });
      return this.sortPublicLookupAppointments(appointments);
    }

    if (this.looksLikePhoneQuery(query)) {
      if (!isValidIndianMobile(query)) {
        throw new BadRequestException(
          'Enter a valid 10-digit Indian mobile number.',
        );
      }

      const appointments = await this.prisma.appointment.findMany({
        where: { patientPhone: { in: phoneLookupDbValues(query) } },
        include: this.publicLookupInclude,
        take: 20,
      });
      return this.sortPublicLookupAppointments(appointments);
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: query },
      include: this.publicLookupInclude,
    });
    return appointment ? [appointment] : [];
  }

  private looksLikePhoneQuery(query: string): boolean {
    return /^[\d+\s\-()]+$/.test(query.trim());
  }

  private sortPublicLookupAppointments<
    T extends { startAt: Date },
  >(appointments: T[]): T[] {
    const now = Date.now();
    const upcoming = appointments
      .filter((appointment) => appointment.startAt.getTime() >= now)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    const past = appointments
      .filter((appointment) => appointment.startAt.getTime() < now)
      .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
    return [...upcoming, ...past];
  }

  private toPublicLookupResult(appointment: {
    id: string;
    status: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
    paymentStatus: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string | null;
    payment: { status: string } | null;
    doctor: {
      specialization: string | null;
      clinicName: string | null;
      user: { fullName: string };
    };
  }) {
    return {
      id: appointment.id,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      reason: appointment.reason,
      paymentStatus: appointment.payment?.status ?? appointment.paymentStatus,
      patientName: this.maskName(appointment.patientName),
      maskedPhone: maskIndianMobile(appointment.patientPhone),
      maskedEmail: maskEmail(appointment.patientEmail),
      doctor: {
        fullName: appointment.doctor.user.fullName,
        specialization: appointment.doctor.specialization,
        clinicName: appointment.doctor.clinicName,
      },
    };
  }

  private maskName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].length <= 2
        ? `${parts[0][0]}*`
        : `${parts[0][0]}${'*'.repeat(Math.max(1, parts[0].length - 2))}${parts[0].slice(-1)}`;
    }
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
}
