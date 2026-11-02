import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AppointmentStatus,
  NotificationType,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AppointmentScheduler {
  private readonly logger = new Logger(AppointmentScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoComplete() {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const result = await this.prisma.appointment.updateMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        startAt: { lt: cutoff },
      },
      data: { status: AppointmentStatus.COMPLETED },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-completed ${result.count} appointment(s)`);
    }
  }

  /**
   * Remind patients/doctors that an appointment starts soon.
   * Runs every minute; deduped via reminderSentAt.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async sendUpcomingReminders() {
    const minutes = Number(process.env.NOTIFICATION_REMINDER_MINUTES ?? 15);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + minutes * 60 * 1000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null,
        startAt: { gt: now, lte: windowEnd },
      },
      include: {
        doctor: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
      take: 100,
    });

    for (const appointment of upcoming) {
      try {
        const userIds = [
          appointment.doctor.userId,
          appointment.patient?.userId,
        ].filter((id): id is string => Boolean(id));

        if (userIds.length > 0) {
          const when = appointment.startAt.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          await this.notificationService.createForUsers({
            userIds,
            type: NotificationType.APPOINTMENT_REMINDER,
            title: 'Appointment starting soon',
            body: `Your appointment starts at ${when}.`,
            linkUrl: `/call?appointmentId=${appointment.id}`,
            meta: { appointmentId: appointment.id },
          });
        }

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: new Date() },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}`,
          error,
        );
      }
    }

    if (upcoming.length > 0) {
      this.logger.log(`Sent ${upcoming.length} appointment reminder(s)`);
    }
  }

  /**
   * Clean up unpaid appointments after 24 hours
   * Runs daily at 2 AM UTC
   */
  @Cron('0 2 * * *')
  async cleanupUnpaidAppointments() {
    try {
      this.logger.log('Starting unpaid appointment cleanup');

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const unpaidAppointments = await this.prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.REQUESTED,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: { lt: cutoff },
        },
        include: {
          doctor: { include: { user: true } },
          patient: { select: { userId: true } },
        },
      });

      for (const appointment of unpaidAppointments) {
        try {
          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: AppointmentStatus.CANCELLED },
          });

          await this.emailService.sendAppointmentCancelled(
            appointment,
            appointment.doctor,
            'Appointment cancelled due to unpaid status',
          );

          const userIds = [
            appointment.doctor.userId,
            appointment.patient?.userId,
          ].filter((id): id is string => Boolean(id));

          if (userIds.length > 0) {
            await this.notificationService.createForUsers({
              userIds,
              type: NotificationType.APPOINTMENT_CANCELLED,
              title: 'Appointment cancelled',
              body: 'Appointment was cancelled because payment was not completed in time.',
              linkUrl: `/appointments/${appointment.id}`,
              meta: { appointmentId: appointment.id, reason: 'unpaid' },
            });
          }

          this.logger.log(
            `Cleaned up unpaid appointment ${appointment.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to cleanup appointment ${appointment.id}`,
            error,
          );
        }
      }

      this.logger.log(
        `Unpaid appointment cleanup completed: ${unpaidAppointments.length} appointments cleaned`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup unpaid appointments', error);
    }
  }

  /**
   * Monitor unverified payments
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async monitorUnverifiedPayments() {
    try {
      this.logger.log('Starting unverified payment monitoring');

      const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const unverifiedPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: { lt: cutoff },
        },
        include: {
          appointment: {
            include: {
              doctor: { include: { user: true } },
              patient: { select: { userId: true } },
            },
          },
        },
      });

      for (const payment of unverifiedPayments) {
        try {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              failureReason: 'Payment verification timeout',
            },
          });

          const patientUserId = payment.appointment.patient?.userId;
          if (patientUserId) {
            await this.notificationService.createForUsers({
              userIds: [patientUserId],
              type: NotificationType.PAYMENT_FAILED,
              title: 'Payment failed',
              body: 'Payment verification timed out. Please try booking again.',
              linkUrl: `/appointments/${payment.appointmentId}`,
              meta: {
                appointmentId: payment.appointmentId,
                paymentId: payment.id,
              },
            });
          }

          this.logger.log(
            `Marked payment ${payment.id} as failed due to timeout`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process payment ${payment.id}`,
            error,
          );
        }
      }

      this.logger.log(
        `Unverified payment monitoring completed: ${unverifiedPayments.length} payments checked`,
      );
    } catch (error) {
      this.logger.error('Failed to monitor unverified payments', error);
    }
  }

  /**
   * Retry failed emails
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedEmails() {
    try {
      await this.emailService.retryFailedEmails();
    } catch (error) {
      this.logger.error('Failed to retry failed emails', error);
    }
  }
}
