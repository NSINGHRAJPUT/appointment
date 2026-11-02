import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, CallType, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async assertCanJoin(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });
    if (!appointment || appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Call allowed only for confirmed appointment',
      );
    }
    const isParticipant =
      appointment.doctor.userId === userId ||
      appointment.patient?.userId === userId;
    if (!isParticipant) throw new ForbiddenException('Not your appointment');
    return appointment;
  }

  async start(
    appointmentId: string,
    userId: string,
    type: CallType = CallType.VIDEO,
  ) {
    const appointment = await this.assertCanJoin(appointmentId, userId);
    const session = await this.prisma.callSession.create({
      data: { appointmentId, type },
    });

    const recipientId =
      appointment.doctor.userId === userId
        ? appointment.patient?.userId
        : appointment.doctor.userId;

    if (recipientId) {
      void this.notificationService
        .createForUsers({
          userIds: [recipientId],
          type: NotificationType.CALL_STARTED,
          title: 'Call started',
          body: 'Your appointment call has started. Tap to join.',
          linkUrl: `/call?appointmentId=${appointmentId}`,
          meta: { appointmentId, callSessionId: session.id, callType: type },
        })
        .catch(() => undefined);
    }

    return session;
  }

  async end(appointmentId: string, userId: string) {
    await this.assertCanJoin(appointmentId, userId);
    const open = await this.prisma.callSession.findFirst({
      where: { appointmentId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!open) {
      throw new NotFoundException('No active call session');
    }
    return this.prisma.callSession.update({
      where: { id: open.id },
      data: { endedAt: new Date() },
    });
  }
}
