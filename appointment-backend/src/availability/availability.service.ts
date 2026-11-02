import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  getByDoctorUserId(doctorUserId: string) {
    return this.prisma.availability.findMany({
      where: {
        doctor: { userId: doctorUserId },
      },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async create(
    doctorUserId: string,
    body: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMins: number;
      timezoneOffsetMinutes?: number;
    },
  ) {
    // Get doctor profile first
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    // If timezoneOffsetMinutes provided, convert local HH:MM to UTC HH:MM and adjust dayOfWeek
    let { dayOfWeek, startTime, endTime, slotMins, timezoneOffsetMinutes } =
      body;

    if (typeof timezoneOffsetMinutes === 'number') {
      const parseHHmm = (s: string) => {
        const [hh, mm] = s.split(':').map((v) => parseInt(v, 10));
        return hh * 60 + mm;
      };
      const formatHHmm = (minutes: number) => {
        const m = ((minutes % 1440) + 1440) % 1440;
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      };

      const startLocal = parseHHmm(startTime);
      const endLocal = parseHHmm(endTime);

      const startUtcTotal = startLocal - timezoneOffsetMinutes;
      const endUtcTotal = endLocal - timezoneOffsetMinutes;

      const dayShiftStart = Math.floor(startUtcTotal / 1440);
      const dayShiftEnd = Math.floor(endUtcTotal / 1440);

      // If start or end shift day, favor start's shift for dayOfWeek calculation
      const dayShift = dayShiftStart;

      dayOfWeek = (((dayOfWeek + dayShift) % 7) + 7) % 7;
      startTime = formatHHmm(startUtcTotal);
      endTime = formatHHmm(endUtcTotal);
    }

    return this.prisma.availability.create({
      data: {
        doctorId: doctorProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        slotMins,
      },
    });
  }

  async deleteByDoctorUserId(doctorUserId: string) {
    // Get doctor profile first
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      throw new BadRequestException('Doctor profile not found');
    }

    const result = await this.prisma.availability.deleteMany({
      where: {
        doctorId: doctorProfile.id,
      },
    });

    return { deletedCount: result.count };
  }
}
