import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  isValidIndianMobile,
  normalizeIndianMobile,
} from '../common/phone.util';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  profile(userId: string) {
    return this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            gender: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async updateProfile(
    userId: string,
    input: {
      fullName?: string;
      phoneNumber?: string;
      whatsappNumber?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
    },
  ) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException('Patient profile not found');
    }

    if (input.phoneNumber?.trim() && !isValidIndianMobile(input.phoneNumber)) {
      throw new BadRequestException(
        'Enter a valid 10-digit Indian mobile number',
      );
    }
    if (
      input.whatsappNumber?.trim() &&
      !isValidIndianMobile(input.whatsappNumber)
    ) {
      throw new BadRequestException(
        'Enter a valid 10-digit WhatsApp number',
      );
    }

    return this.prisma.patientProfile.update({
      where: { userId },
      data: {
        gender: input.gender?.trim() || undefined,
        address: input.address?.trim() || undefined,
        dateOfBirth: input.dateOfBirth
          ? new Date(input.dateOfBirth)
          : undefined,
        user: {
          update: {
            fullName: input.fullName?.trim() || undefined,
            phoneNumber: input.phoneNumber?.trim()
              ? normalizeIndianMobile(input.phoneNumber)
              : undefined,
            whatsappNumber: input.whatsappNumber?.trim()
              ? normalizeIndianMobile(input.whatsappNumber)
              : undefined,
            gender: input.gender?.trim() || undefined,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            gender: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
}
