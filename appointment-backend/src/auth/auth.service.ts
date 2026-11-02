import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, BookingMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { EmailService } from '../email/email.service';
import { isValidIndianMobile, normalizeIndianMobile } from '../common/phone.util';

const DAY_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly emailService: EmailService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    phone?: string;
    gender?: string;
    licenseNumber?: string;
    experience?: string;
    yearsOfExperience?: string;
    degree?: string;
    university?: string;
    graduationYear?: string;
    primarySpecialty?: string;
    specialization?: string;
    subSpecialties?: string[];
    conditions?: string[];
    clinicName?: string;
    clinicAddress?: string;
    city?: string;
    country?: string;
    consultationFee?: string;
    latitude?: number;
    longitude?: number;
    bookingMode?: string;
    isOnline?: boolean;
    responseTimeMins?: number;
    consultationModes?: string[];
    onlineConsultation?: boolean;
    slots?: { day: string; from: string; to: string }[];
    whatsapp?: string;
    whatsappOptOut?: boolean;
    documents?: Express.Multer.File[];
  }) {
    try {
      if (input.role === Role.ADMIN) {
        throw new ForbiddenException('Admin accounts cannot be self-registered');
      }
      if (!input.phone?.trim()) {
        throw new BadRequestException('Phone number is required');
      }
      if (!isValidIndianMobile(input.phone)) {
        throw new BadRequestException(
          'Phone must be a valid 10-digit Indian mobile number',
        );
      }
      const normalizedPhone = normalizeIndianMobile(input.phone);
      const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
      if (exists) throw new BadRequestException('Email already exists');
      const passwordHash = await bcrypt.hash(input.password, 10);

      const priceCents = input.consultationFee
        ? Math.round(parseFloat(input.consultationFee) * 100) 
        : 0;

      // Validate slots if provided - filter out empty slots first
      if (input.slots && input.slots.length > 0) {
        const validSlots = input.slots.filter(slot => slot && (slot.day || slot.from || slot.to));
        
        if (validSlots.length === 0) {
          // If all slots are empty, treat as no slots provided
          input.slots = undefined;
        } else {
          // Validate remaining slots have all required fields
          for (const slot of validSlots) {
            if (!slot.day || !slot.from || !slot.to) {
              throw new BadRequestException('Each slot must have day, from, and to times. Required fields: day, from, to');
            }
          }
          input.slots = validSlots;
        }
      }

      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          role: input.role,
          phoneNumber: normalizedPhone,
          gender: input.gender,
          whatsappNumber: !input.whatsappOptOut ? input.whatsapp : undefined,
          patientProfile: input.role === Role.PATIENT ? { create: {} } : undefined,
          doctorProfile:
            input.role === Role.DOCTOR
              ? {
                  create: {
                    specialization: input.specialization || input.primarySpecialty,
                    licenseNumber: input.licenseNumber || undefined,
                    yearsOfExperience: input.yearsOfExperience 
                      ? parseInt(input.yearsOfExperience) 
                      : (input.experience ? parseInt(input.experience) : undefined),
                    degree: input.degree,
                    university: input.university,
                    graduationYear: input.graduationYear ? parseInt(input.graduationYear) : undefined,
                    subSpecialties: input.subSpecialties ?? [],
                    conditions: input.conditions ?? [],
                    clinicName: input.clinicName,
                    clinicAddress: input.clinicAddress,
                    city: input.city,
                    country: input.country,
                    latitude: input.latitude,
                    longitude: input.longitude,
                    bookingMode: (input.bookingMode as BookingMode) || BookingMode.INSTANT,
                    isOnline: input.isOnline ?? false,
                    responseTimeMins: input.responseTimeMins,
                    consultationModes: input.consultationModes ?? [],
                    onlineConsultation: input.onlineConsultation ?? false,
                    onboardingStatus: 'DRAFT',
                    submittedAt: null,
                    approvedAt: null,
                    priceCents,
                    availabilities: input.slots?.length
                      ? {
                          create: input.slots.map((s) => ({
                            dayOfWeek: DAY_MAP[s.day] ?? 1,
                            startTime: s.from,
                            endTime: s.to,
                            slotMins: 30,
                          })),
                        }
                      : undefined,
                  },
                }
              : undefined,
        },
        include: { 
          patientProfile: { select: { id: true } },
          doctorProfile: { select: { id: true } },
        },
      });

      // Process documents if provided and role is DOCTOR
      if (input.role === Role.DOCTOR && input.documents && input.documents.length > 0 && user.doctorProfile) {
        const doctorId = user.doctorProfile.id;

        for (const file of input.documents) {
          try {
            // Upload file to Cloudinary
            const uploadResult = await this.cloudinaryService.uploadFile(file, doctorId);

            // Create DoctorDocument record
            await this.prisma.doctorDocument.create({
              data: {
                doctorId,
                title: file.originalname,
                fileUrl: uploadResult.url,
              },
            });
          } catch (error) {
            // Log error and throw meaningful error message
            console.error(`Failed to upload document ${file.originalname}:`, error);
            throw new BadRequestException(`Failed to upload document ${file.originalname}. Please try again.`);
          }
        }
      }

      // Account linking: attach guest appointments to the new patient profile
      if (input.role === Role.PATIENT && user.patientProfile) {
        const patientProfileId = user.patientProfile.id;
        const orConditions: any[] = [];
        if (input.phone) orConditions.push({ patientPhone: input.phone });
        if (input.email) orConditions.push({ patientEmail: input.email });

        if (orConditions.length > 0) {
          await this.prisma.appointment.updateMany({
            where: { patientId: null, OR: orConditions },
            data: { patientId: patientProfileId },
          });
        }
      }

      // Fetch user with documents if doctor
      const userWithDocuments = await this.prisma.user.findUnique({
        where: { id: user.id },
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
            },
          },
          patientProfile: true,
        },
      });

      if (userWithDocuments) {
        void this.emailService
          .sendSignupConfirmation(userWithDocuments)
          .catch((err) =>
            console.error('Failed to send signup confirmation email:', err),
          );
      }

      return this.issueToken(user.id, user.role, user.email, userWithDocuments);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }
    const isValid = await bcrypt.compare(input.password, user.passwordHash ?? '');
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    
    // Fetch user with full profile data
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
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
          },
        },
        patientProfile: true,
      },
    });
    
    return this.issueToken(user.id, user.role, user.email, userWithProfile);
  }

  async issueTokenAfterOtp(userId: string, role: Role, email: string | null) {
    // Fetch user with full profile data
    const user = await this.prisma.user.findUnique({
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
          },
        },
        patientProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    return this.issueToken(userId, role, email, user);
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    // Validate password length
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash the new password using bcrypt with salt rounds 10
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password hash in the database
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private issueToken(userId: string, role: Role, email: string | null, user?: any) {
    const accessToken = this.jwt.sign({ sub: userId, role, email });
    return { 
      accessToken,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        doctorProfile: user.doctorProfile,
        patientProfile: user.patientProfile,
      } : undefined,
    };
  }
}
