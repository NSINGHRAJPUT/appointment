import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { appointmentId: string; authorId: string; rating: number; comment?: string }) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      include: { doctor: { include: { user: true } }, patient: true },
    });
    if (!appointment || appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Review allowed only after completed appointment');
    }
    if (appointment.patient.userId !== input.authorId) {
      throw new BadRequestException('Only appointment patient can review');
    }
    return this.prisma.review.create({
      data: {
        appointmentId: input.appointmentId,
        authorId: input.authorId,
        doctorUserId: appointment.doctor.userId,
        rating: input.rating,
        comment: input.comment,
      },
    });
  }
}
