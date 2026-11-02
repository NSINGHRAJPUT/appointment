import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  BookingMode,
  DoctorApprovalStatus,
} from '@prisma/client';
import { CloudinaryService } from '../common/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  async upsertOnboarding(
    userId: string,
    input: {
      bio?: string;
      specialization?: string;
      yearsOfExperience?: number;
      clinicName?: string;
      clinicAddress?: string;
      city?: string;
      licenseNumber?: string;
      whatsappNumber?: string;
      priceCents?: number;
      currency?: string;
      country?: string;
      degree?: string;
      university?: string;
      graduationYear?: number;
      onlineConsultation?: boolean;
      subSpecialties?: string[];
      conditions?: string[];
    },
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!doctor) throw new BadRequestException('Doctor profile not found');
    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        bio: input.bio,
        specialization: input.specialization,
        subSpecialties: input.subSpecialties,
        conditions: input.conditions,
        priceCents:
          typeof input.priceCents === 'number' ? input.priceCents : undefined,
        currency: input.currency,
        yearsOfExperience: input.yearsOfExperience,
        clinicName: input.clinicName,
        clinicAddress: input.clinicAddress,
        city: input.city,
        country: input.country,
        licenseNumber: input.licenseNumber,
        degree: input.degree,
        university: input.university,
        graduationYear: input.graduationYear,
        onlineConsultation: input.onlineConsultation,
        onboardingStatus: DoctorApprovalStatus.SUBMITTED,
        submittedAt: new Date(),
        user: { update: { whatsappNumber: input.whatsappNumber } },
      },
    });
  }

  updateSettings(
    userId: string,
    input: {
      bookingMode?: BookingMode;
      isOnline?: boolean;
      responseTimeMins?: number;
    },
  ) {
    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        ...(input.bookingMode !== undefined && {
          bookingMode: input.bookingMode,
        }),
        ...(input.isOnline !== undefined && {
          isOnline: input.isOnline,
          nextAvailableAt: input.isOnline ? new Date() : null,
        }),
        ...(input.responseTimeMins !== undefined && {
          responseTimeMins: input.responseTimeMins,
        }),
      },
    });
  }

  async findAvailableForInstant() {
    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        onboardingStatus: DoctorApprovalStatus.APPROVED,
        bookingMode: BookingMode.INSTANT,
        isOnline: true,
      },
      include: {
        user: { select: { id: true, fullName: true, whatsappNumber: true } },
      },
    });

    const withMetrics = await this.attachMetricsToDoctors(doctors);
    return withMetrics.sort(
      (a, b) =>
        (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
        (a.responseTimeMins ?? 999) - (b.responseTimeMins ?? 999),
    );
  }

  private async computeDoctorRating(doctorUserIds: string[]) {
    const reviews = await this.prisma.review.findMany({
      where: { doctorUserId: { in: doctorUserIds } },
      select: { doctorUserId: true, rating: true },
    });
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of reviews) {
      const prev = map.get(r.doctorUserId) ?? { sum: 0, count: 0 };
      prev.sum += r.rating;
      prev.count += 1;
      map.set(r.doctorUserId, prev);
    }
    return map;
  }

  async getNextAvailableSlots(
    doctorId: string,
    fromIso: string | undefined,
    count: number,
  ) {
    const from = fromIso ? new Date(fromIso) : new Date();
    if (Number.isNaN(from.getTime()))
      throw new BadRequestException('Invalid from time');
    if (count < 1 || count > 20)
      throw new BadRequestException('Invalid slots count');

    const availabilities = await this.prisma.availability.findMany({
      where: { doctorId },
    });
    if (availabilities.length === 0) return [];

    const maxDays = 30;
    const windowEnd = new Date(from);
    windowEnd.setDate(windowEnd.getDate() + maxDays);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        status: {
          in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED],
        },
        startAt: { lt: windowEnd },
        endAt: { gt: from },
      },
      select: { startAt: true, endAt: true },
    });

    const slots: Array<{ startAt: Date; endAt: Date }> = [];
    const byDay = new Map<number, typeof availabilities>();
    for (const a of availabilities) {
      const list = byDay.get(a.dayOfWeek) ?? [];
      list.push(a);
      byDay.set(a.dayOfWeek, list);
    }

    for (
      let offset = 0;
      offset < maxDays && slots.length < count;
      offset += 1
    ) {
      const day = new Date(from);
      day.setDate(day.getDate() + offset);
      day.setHours(0, 0, 0, 0);
      const dow = this.dayOfWeek(day);
      const dayAvail = byDay.get(dow) ?? [];
      if (dayAvail.length === 0) continue;

      const daySlots: Array<{ startAt: Date; endAt: Date }> = [];
      dayAvail.sort(
        (a, b) =>
          this.parseTimeToMinutes(a.startTime) -
          this.parseTimeToMinutes(b.startTime),
      );

      for (const a of dayAvail) {
        const startMinutes = this.parseTimeToMinutes(a.startTime);
        const endMinutes = this.parseTimeToMinutes(a.endTime);
        if (endMinutes <= startMinutes) continue;

        const slotMins = a.slotMins;
        for (let m = startMinutes; m + slotMins <= endMinutes; m += slotMins) {
          const slotStart = new Date(day.getTime() + m * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + slotMins * 60 * 1000);
          if (slotStart < from) continue;

          const isOverlapping = appointments.some((ap) =>
            this.overlaps(ap.startAt, ap.endAt, slotStart, slotEnd),
          );
          if (!isOverlapping)
            daySlots.push({ startAt: slotStart, endAt: slotEnd });
        }
      }

      daySlots.sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
      for (const s of daySlots) {
        slots.push(s);
        if (slots.length >= count) break;
      }
    }

    return slots.slice(0, count);
  }

  private async attachMetricsToDoctors(doctors: Array<any>) {
    const doctorUserIds = doctors.map((d) => d.userId as string);
    const ratingMap = await this.computeDoctorRating(doctorUserIds);

    const nextSlots = await Promise.all(
      doctors.map(async (d) => {
        const [slot] = await this.getNextAvailableSlots(d.id, undefined, 1);
        return slot?.startAt?.toISOString() ?? null;
      }),
    );

    return doctors.map((d, idx) => {
      const metrics = ratingMap.get(d.userId as string);
      const ratingAvg =
        metrics && metrics.count > 0 ? metrics.sum / metrics.count : null;
      const reviewCount = metrics?.count ?? 0;
      return {
        ...d,
        ratingAvg,
        reviewCount,
        nextAvailableSlotAt: nextSlots[idx],
      };
    });
  }

  async listDoctors(query: {
    page: number;
    pageSize: number;
    q?: string;
    specialties?: string;
    city?: string;
    availableOnly?: boolean;
    sortBy?: 'next' | 'rating';
  }) {
    const specialtyList = (query.specialties ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const where = {
      onboardingStatus: DoctorApprovalStatus.APPROVED,
      ...(query.city ? { city: query.city } : {}),
      ...(specialtyList.length > 0
        ? {
            OR: specialtyList.map((label) => ({
              specialization: {
                contains: label,
                mode: 'insensitive' as const,
              },
            })),
          }
        : query.q
          ? {
              OR: [
                {
                  specialization: {
                    contains: query.q,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  user: {
                    fullName: {
                      contains: query.q,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              ],
            }
          : {}),
      ...(query.availableOnly
        ? { availabilities: { some: { isActive: true } } }
        : {}),
    };

    const rawDoctors = await this.prisma.doctorProfile.findMany({
      where,
      take: 500,
      include: {
        user: { select: { id: true, fullName: true, whatsappNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withMetrics = await this.attachMetricsToDoctors(rawDoctors);
    const filtered = query.availableOnly
      ? withMetrics.filter((d) => Boolean(d.nextAvailableSlotAt))
      : withMetrics;
    const sorted =
      query.sortBy === 'rating'
        ? filtered.sort((a, b) => (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1))
        : filtered.sort((a, b) =>
            (a.nextAvailableSlotAt ?? '').localeCompare(
              b.nextAvailableSlotAt ?? '',
            ),
          );

    const total = sorted.length;
    const skip = (query.page - 1) * query.pageSize;

    return {
      items: sorted.slice(skip, skip + query.pageSize),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  private specialtyCountWhere(label: string) {
    const base = { onboardingStatus: DoctorApprovalStatus.APPROVED };
    const normalized = label.trim().toLowerCase();

    if (normalized === 'general practice') {
      return {
        ...base,
        OR: [
          { specialization: null },
          { specialization: '' },
          { specialization: { equals: label, mode: 'insensitive' as const } },
          { specialization: { contains: 'general', mode: 'insensitive' as const } },
        ],
      };
    }

    return {
      ...base,
      specialization: { contains: label, mode: 'insensitive' as const },
    };
  }

  async countDoctorsForSpecialty(label: string) {
    return this.prisma.doctorProfile.count({
      where: this.specialtyCountWhere(label),
    });
  }

  async getSpecialtyCounts(labels: string[]) {
    const uniqueLabels = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
    const counts = await Promise.all(
      uniqueLabels.map(async (label) => ({
        label,
        count: await this.countDoctorsForSpecialty(label),
      })),
    );
    return { counts };
  }

  getDoctorById(doctorId: string) {
    return this.prisma.doctorProfile
      .findFirst({
        where: {
          id: doctorId,
          onboardingStatus: DoctorApprovalStatus.APPROVED,
        },
        include: {
          user: { select: { id: true, fullName: true, whatsappNumber: true } },
          availabilities: { where: { isActive: true } },
        },
      })
      .then(async (doctor) => {
        if (!doctor) return null;
        const ratingMetrics = await this.computeDoctorRating([doctor.userId]);
        const metrics = ratingMetrics.get(doctor.userId) ?? {
          sum: 0,
          count: 0,
        };
        const ratingAvg =
          metrics.count > 0 ? metrics.sum / metrics.count : null;

        const reviews = await this.prisma.review.findMany({
          where: { doctorUserId: doctor.userId },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const [next] = await this.getNextAvailableSlots(
          doctor.id,
          undefined,
          1,
        );

        return {
          ...doctor,
          ratingAvg,
          reviewCount: metrics.count,
          nextAvailableSlotAt: next?.startAt?.toISOString() ?? null,
          reviews,
        };
      });
  }

  /**
   * Retrieves doctor profile by user ID
   * @param userId User ID
   * @returns DoctorProfile or null if not found
   */
  async getDoctorProfileByUserId(userId: string) {
    return this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Get doctor profile with all details
   * @param userId User ID
   * @returns DoctorProfile with all details
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            fullName: true,
            whatsappNumber: true,
            gender: true,
          },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Doctor profile not found');
    }

    const { user, ...doctorFields } = profile;
    return {
      ...doctorFields,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      whatsappNumber: user.whatsappNumber,
      user,
    };
  }

  /**
   * Update doctor profile without changing onboardingStatus
   * @param userId User ID
   * @param input Profile update data
   * @returns Updated DoctorProfile
   */
  async updateProfile(
    userId: string,
    input: {
      bio?: string;
      specialization?: string;
      yearsOfExperience?: number;
      clinicName?: string;
      clinicAddress?: string;
      city?: string;
      licenseNumber?: string;
      whatsappNumber?: string;
      priceCents?: number;
      currency?: string;
      country?: string;
      degree?: string;
      university?: string;
      graduationYear?: number;
      onlineConsultation?: boolean;
      subSpecialties?: string[];
      conditions?: string[];
      latitude?: number;
      longitude?: number;
      bookingMode?: BookingMode;
      isOnline?: boolean;
      responseTimeMins?: number;
      consultationModes?: string[];
    },
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!doctor) throw new BadRequestException('Doctor profile not found');

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        bio: input.bio,
        specialization: input.specialization,
        priceCents:
          typeof input.priceCents === 'number' ? input.priceCents : undefined,
        currency: input.currency,
        yearsOfExperience: input.yearsOfExperience,
        clinicName: input.clinicName,
        clinicAddress: input.clinicAddress,
        city: input.city,
        country: input.country,
        licenseNumber: input.licenseNumber,
        degree: input.degree,
        university: input.university,
        graduationYear: input.graduationYear,
        onlineConsultation: input.onlineConsultation,
        subSpecialties: input.subSpecialties,
        conditions: input.conditions,
        latitude: input.latitude,
        longitude: input.longitude,
        bookingMode: input.bookingMode,
        isOnline: input.isOnline,
        responseTimeMins: input.responseTimeMins,
        consultationModes: input.consultationModes,
        user: input.whatsappNumber
          ? { update: { whatsappNumber: input.whatsappNumber } }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            fullName: true,
            whatsappNumber: true,
            gender: true,
          },
        },
      },
    });
  }

  /**
   * Submit doctor onboarding for approval
   * @param userId User ID
   * @returns Updated DoctorProfile with SUBMITTED status
   */
  async submitOnboarding(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!doctor) throw new BadRequestException('Doctor profile not found');

    return this.prisma.doctorProfile.update({
      where: { userId },
      data: {
        onboardingStatus: DoctorApprovalStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            fullName: true,
            whatsappNumber: true,
            gender: true,
          },
        },
      },
    });
  }

  /**
   * Uploads a document for a doctor
   * @param doctorId Doctor ID
   * @param file File to upload
   * @param title Optional document title
   * @returns Created DoctorDocument
   */
  async uploadDocument(
    doctorId: string,
    file: Express.Multer.File,
    title?: string,
  ) {
    // Verify doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    try {
      // Upload file to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        doctorId,
      );

      // Create DoctorDocument record
      const document = await this.prisma.doctorDocument.create({
        data: {
          doctorId,
          title: title || file.originalname,
          fileUrl: uploadResult.url,
        },
      });

      return document;
    } catch (error) {
      // If it's already a BadRequestException from CloudinaryService, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Otherwise, throw a generic upload failure error
      throw new BadRequestException('Failed to upload document');
    }
  }

  /**
   * Deletes a document for a doctor
   * @param doctorId Doctor ID
   * @param documentId Document ID to delete
   */
  async deleteDocument(doctorId: string, documentId: string): Promise<void> {
    // Verify document exists and belongs to the doctor
    const document = await this.prisma.doctorDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    if (document.doctorId !== doctorId) {
      throw new BadRequestException('You can only delete your own documents');
    }

    try {
      // Extract publicId from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}
      // We need to extract the public_id which includes the folder structure
      const urlParts = document.fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');

      if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
        throw new BadRequestException('Invalid document URL format');
      }

      // The public_id is everything after /upload/v{version}/
      // We skip the version part and join the rest
      const publicId = urlParts.slice(uploadIndex + 2).join('/');

      // Delete file from Cloudinary
      await this.cloudinaryService.deleteFile(publicId);

      // Delete DoctorDocument record from database
      await this.prisma.doctorDocument.delete({
        where: { id: documentId },
      });
    } catch (error) {
      // If it's already a BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Otherwise, throw a generic deletion failure error
      throw new BadRequestException('Failed to delete document');
    }
  }

  /**
   * Retrieves all documents for a doctor
   * @param doctorId Doctor ID
   * @returns Array of DoctorDocument records ordered by creation date (newest first)
   */
  async getDocuments(doctorId: string) {
    // Verify doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    // Retrieve all documents for the doctor, ordered by creation date (newest first)
    const documents = await this.prisma.doctorDocument.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }
}
