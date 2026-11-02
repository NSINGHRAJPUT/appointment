import { BadRequestException, Injectable } from '@nestjs/common';
import { DoctorApprovalStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async updateDoctorApproval(
    doctorId: string,
    approve: boolean,
    notes?: string,
  ) {
    const doctor = await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: {
        onboardingStatus: approve
          ? DoctorApprovalStatus.APPROVED
          : DoctorApprovalStatus.REJECTED,
        adminNotes: notes,
        approvedAt: approve ? new Date() : null,
      },
    });

    void this.notificationService
      .createForUsers({
        userIds: [doctor.userId],
        type: NotificationType.DOCTOR_APPROVAL,
        title: approve ? 'Profile approved' : 'Profile rejected',
        body: approve
          ? 'Your doctor profile has been approved. You can start accepting appointments.'
          : notes?.trim()
            ? `Your doctor profile was rejected: ${notes.trim()}`
            : 'Your doctor profile was rejected. Please update and resubmit.',
        linkUrl: '/dashboard',
        meta: { doctorId, approved: approve },
      })
      .catch(() => undefined);

    return doctor;
  }

  getDashboard() {
    return this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'DOCTOR' } }),
      this.prisma.user.count({ where: { role: 'PATIENT' } }),
      this.prisma.doctorProfile.count({
        where: { onboardingStatus: DoctorApprovalStatus.SUBMITTED },
      }),
      this.prisma.appointment.count(),
    ]);
  }

  listPendingDoctors(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.$transaction(async (tx) => {
      const [total, items] = await Promise.all([
        tx.doctorProfile.count({
          where: { onboardingStatus: DoctorApprovalStatus.SUBMITTED },
        }),
        tx.doctorProfile.findMany({
          where: { onboardingStatus: DoctorApprovalStatus.SUBMITTED },
          skip,
          take: query.pageSize,
          orderBy: { submittedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                whatsappNumber: true,
              },
            },
          },
        }),
      ]);
      return { items, total, page: query.page, pageSize: query.pageSize };
    });
  }

  listAllUsers(query: { page: number; pageSize: number; role?: 'PATIENT' | 'DOCTOR' | 'ADMIN' }) {
    const skip = (query.page - 1) * query.pageSize;
    const where = query.role ? { role: query.role } : {};
    return this.prisma.$transaction(async (tx) => {
      const [total, items] = await Promise.all([
        tx.user.count({ where }),
        tx.user.findMany({
          where,
          skip,
          take: query.pageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            phoneNumber: true,
            gender: true,
            whatsappNumber: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            doctorProfile: {
              select: {
                id: true,
                specialization: true,
                onboardingStatus: true,
              },
            },
            patientProfile: {
              select: {
                id: true,
              },
            },
          },
        }),
      ]);
      return { items, total, page: query.page, pageSize: query.pageSize };
    });
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        gender: true,
        whatsappNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: {
          select: {
            id: true,
            bio: true,
            specialization: true,
            subSpecialties: true,
            conditions: true,
            degree: true,
            university: true,
            graduationYear: true,
            priceCents: true,
            currency: true,
            yearsOfExperience: true,
            clinicName: true,
            clinicAddress: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            licenseNumber: true,
            bookingMode: true,
            isOnline: true,
            responseTimeMins: true,
            nextAvailableAt: true,
            consultationModes: true,
            onlineConsultation: true,
            onboardingStatus: true,
            adminNotes: true,
            submittedAt: true,
            approvedAt: true,
            createdAt: true,
            updatedAt: true,
            documents: {
              select: {
                id: true,
                title: true,
                fileUrl: true,
                createdAt: true,
              },
            },
            availabilities: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                slotMins: true,
                isActive: true,
              },
            },
            appointments: {
              select: {
                id: true,
                status: true,
                startAt: true,
                endAt: true,
                createdAt: true,
              },
            },
          },
        },
        patientProfile: {
          select: {
            id: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            createdAt: true,
            updatedAt: true,
            appointments: {
              select: {
                id: true,
                status: true,
                startAt: true,
                endAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateUser(
    userId: string,
    data: {
      fullName?: string;
      phoneNumber?: string;
      gender?: string;
      whatsappNumber?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        gender: true,
        whatsappNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update user and profile details (admin only)
   * @param adminId Admin user ID
   * @param userId Target user ID
   * @param data Update data
   * @returns Updated user with nested profiles
   */
  async updateUserProfile(
    adminId: string,
    userId: string,
    data: {
      // User base fields
      email?: string;
      phoneNumber?: string;
      fullName?: string;
      whatsappNumber?: string;
      gender?: string;
      isActive?: boolean;
      // DoctorProfile fields
      bio?: string;
      specialization?: string;
      subSpecialties?: string[];
      conditions?: string[];
      degree?: string;
      university?: string;
      graduationYear?: number;
      priceCents?: number;
      currency?: string;
      yearsOfExperience?: number;
      clinicName?: string;
      clinicAddress?: string;
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      licenseNumber?: string;
      bookingMode?: string;
      isOnline?: boolean;
      responseTimeMins?: number;
      nextAvailableAt?: Date;
      consultationModes?: string[];
      onlineConsultation?: boolean;
      onboardingStatus?: string;
      adminNotes?: string;
      // PatientProfile fields
      dateOfBirth?: Date;
      address?: string;
    },
  ) {
    // Get user to determine role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: { select: { id: true } },
        patientProfile: { select: { id: true } },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Prepare user update data
    const userUpdateData: any = {};
    if (data.email !== undefined) userUpdateData.email = data.email;
    if (data.phoneNumber !== undefined)
      userUpdateData.phoneNumber = data.phoneNumber;
    if (data.fullName !== undefined) userUpdateData.fullName = data.fullName;
    if (data.whatsappNumber !== undefined)
      userUpdateData.whatsappNumber = data.whatsappNumber;
    if (data.gender !== undefined) userUpdateData.gender = data.gender;
    if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;

    // Prepare doctor profile update data
    const doctorUpdateData: any = {};
    if (user.doctorProfile) {
      if (data.bio !== undefined) doctorUpdateData.bio = data.bio;
      if (data.specialization !== undefined)
        doctorUpdateData.specialization = data.specialization;
      if (data.subSpecialties !== undefined)
        doctorUpdateData.subSpecialties = data.subSpecialties;
      if (data.conditions !== undefined)
        doctorUpdateData.conditions = data.conditions;
      if (data.degree !== undefined) doctorUpdateData.degree = data.degree;
      if (data.university !== undefined)
        doctorUpdateData.university = data.university;
      if (data.graduationYear !== undefined)
        doctorUpdateData.graduationYear = data.graduationYear;
      if (data.priceCents !== undefined)
        doctorUpdateData.priceCents = data.priceCents;
      if (data.currency !== undefined)
        doctorUpdateData.currency = data.currency;
      if (data.yearsOfExperience !== undefined)
        doctorUpdateData.yearsOfExperience = data.yearsOfExperience;
      if (data.clinicName !== undefined)
        doctorUpdateData.clinicName = data.clinicName;
      if (data.clinicAddress !== undefined)
        doctorUpdateData.clinicAddress = data.clinicAddress;
      if (data.city !== undefined) doctorUpdateData.city = data.city;
      if (data.country !== undefined) doctorUpdateData.country = data.country;
      if (data.latitude !== undefined)
        doctorUpdateData.latitude = data.latitude;
      if (data.longitude !== undefined)
        doctorUpdateData.longitude = data.longitude;
      if (data.licenseNumber !== undefined)
        doctorUpdateData.licenseNumber = data.licenseNumber;
      if (data.bookingMode !== undefined)
        doctorUpdateData.bookingMode = data.bookingMode;
      if (data.isOnline !== undefined)
        doctorUpdateData.isOnline = data.isOnline;
      if (data.responseTimeMins !== undefined)
        doctorUpdateData.responseTimeMins = data.responseTimeMins;
      if (data.nextAvailableAt !== undefined)
        doctorUpdateData.nextAvailableAt = data.nextAvailableAt;
      if (data.consultationModes !== undefined)
        doctorUpdateData.consultationModes = data.consultationModes;
      if (data.onlineConsultation !== undefined)
        doctorUpdateData.onlineConsultation = data.onlineConsultation;
      if (data.onboardingStatus !== undefined) {
        doctorUpdateData.onboardingStatus = data.onboardingStatus;
        // Set approvedAt if status is APPROVED
        if (data.onboardingStatus === 'APPROVED') {
          doctorUpdateData.approvedAt = new Date();
        }
      }
      if (data.adminNotes !== undefined)
        doctorUpdateData.adminNotes = data.adminNotes;
    }

    // Prepare patient profile update data
    const patientUpdateData: any = {};
    if (user.patientProfile) {
      if (data.dateOfBirth !== undefined)
        patientUpdateData.dateOfBirth = data.dateOfBirth;
      if (data.address !== undefined) patientUpdateData.address = data.address;
    }

    // Update user and profiles in transaction
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update user
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      // Update doctor profile if applicable
      if (user.doctorProfile && Object.keys(doctorUpdateData).length > 0) {
        await tx.doctorProfile.update({
          where: { id: user.doctorProfile.id },
          data: doctorUpdateData,
        });
      }

      // Update patient profile if applicable
      if (user.patientProfile && Object.keys(patientUpdateData).length > 0) {
        await tx.patientProfile.update({
          where: { id: user.patientProfile.id },
          data: patientUpdateData,
        });
      }

      // Log audit trail
      const changedFields: Record<string, any> = {};
      Object.assign(
        changedFields,
        userUpdateData,
        doctorUpdateData,
        patientUpdateData,
      );

      if (Object.keys(changedFields).length > 0) {
        await this.logAuditTrail(
          adminId,
          userId,
          'UPDATE_PROFILE',
          changedFields,
        );
      }

      // Return updated user with all nested data
      return tx.user.findUnique({
        where: { id: userId },
        include: {
          doctorProfile: {
            include: {
              documents: {
                select: {
                  id: true,
                  title: true,
                  fileUrl: true,
                  createdAt: true,
                },
              },
              availabilities: true,
              appointments: true,
            },
          },
          patientProfile: {
            include: {
              appointments: true,
            },
          },
        },
      });
    });

    return updatedUser;
  }

  async deactivateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });
  }

  listAllAppointments(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.$transaction(async (tx) => {
      const [total, items] = await Promise.all([
        tx.appointment.count(),
        tx.appointment.findMany({
          skip,
          take: query.pageSize,
          orderBy: { startAt: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            doctor: {
              select: {
                id: true,
                specialization: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        }),
      ]);
      return { items, total, page: query.page, pageSize: query.pageSize };
    });
  }

  /**
   * Log audit trail for admin changes
   * @param adminId Admin user ID
   * @param userId Target user ID
   * @param action Action performed
   * @param changes Changed fields
   */
  async logAuditTrail(
    adminId: string,
    userId: string,
    action: string,
    changes: Record<string, any>,
  ): Promise<void> {
    // Log to console for now (can be extended to database later)
    console.log(
      `[AUDIT] Admin ${adminId} performed ${action} on user ${userId}`,
      {
        timestamp: new Date().toISOString(),
        changes,
      },
    );
  }
}
