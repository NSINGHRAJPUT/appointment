import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AppointmentStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async listConversations(userId: string) {
    const allowedStatuses: AppointmentStatus[] = [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ];

    const conversations = await this.prisma.conversation.findMany({
      where: {
        appointment: {
          status: { in: allowedStatuses },
          OR: [{ doctor: { userId } }, { patient: { userId } }],
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            status: true,
            startAt: true,
            patientName: true,
            doctor: {
              select: {
                user: { select: { id: true, fullName: true, whatsappNumber: true } },
              },
            },
            patient: {
              select: {
                user: { select: { id: true, fullName: true, whatsappNumber: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, body: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { appointment: { startAt: 'desc' } },
    });

    return conversations.map((c) => ({
      conversationId: c.id,
      appointmentId: c.appointment.id,
      status: c.appointment.status,
      startAt: c.appointment.startAt,
      patientName: c.appointment.patientName,
      doctor: c.appointment.doctor,
      patient: c.appointment.patient,
      lastMessage: c.messages[0] ?? null,
    }));
  }

  async assertCanAccessConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        appointment: {
          OR: [
            { doctor: { userId } },
            { patient: { userId } },
          ],
        },
      },
      select: { id: true },
    });
    if (!conversation) throw new ForbiddenException('No access to conversation');
  }

  listMessages(conversationId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertCanAccessConversation(conversationId, userId);
      return tx.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { sender: { select: { id: true, fullName: true } } },
      });
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
    type: 'TEXT' | 'SIGNAL' = 'TEXT',
  ) {
    if (!body.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (body.trim().length > 2000) {
      throw new BadRequestException('Message too long');
    }

    const msg = await this.prisma.$transaction(async (tx) => {
      await this.assertCanAccessConversation(conversationId, senderId);
      return tx.message.create({
        data: { conversationId, senderId, body: body.trim(), type },
        include: { sender: { select: { id: true, fullName: true } } },
      });
    });

    if (type === 'TEXT') {
      void this.notifyChatRecipient(conversationId, senderId, msg.body).catch(
        () => undefined,
      );
    }

    return msg;
  }

  private async notifyChatRecipient(
    conversationId: string,
    senderId: string,
    body: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        appointment: {
          select: {
            id: true,
            doctor: { select: { userId: true } },
            patient: { select: { userId: true } },
          },
        },
      },
    });
    if (!conversation) return;

    const doctorUserId = conversation.appointment.doctor.userId;
    const patientUserId = conversation.appointment.patient?.userId;
    const recipientId =
      senderId === doctorUserId ? patientUserId : doctorUserId;
    if (!recipientId) return;

    const preview =
      body.length > 120 ? `${body.slice(0, 117)}...` : body;

    await this.notificationService.createForUsers({
      userIds: [recipientId],
      type: NotificationType.CHAT_MESSAGE,
      title: 'New message',
      body: preview,
      linkUrl: `/chat`,
      meta: {
        conversationId,
        appointmentId: conversation.appointment.id,
      },
    });
  }
}
