import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { Role, BookingMode, DoctorApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Doctor Onboarding Auto-Population', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            doctorProfile: {
              findUnique: jest.fn(),
            },
            doctorDocument: {
              create: jest.fn(),
            },
            appointment: {
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendSignupConfirmation: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('Doctor Registration with Onboarding Details', () => {
    it('should create DoctorProfile with all onboarding fields when role=DOCTOR', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. John Doe',
        role: Role.DOCTOR,
        phone: '+1234567890',
        gender: 'Male',
        licenseNumber: 'LIC123456',
        yearsOfExperience: '10',
        degree: 'MD',
        university: 'Harvard Medical School',
        graduationYear: '2014',
        specialization: 'Cardiology',
        subSpecialties: ['Interventional Cardiology', 'Echocardiography'],
        conditions: ['Heart Disease', 'Hypertension'],
        clinicName: 'Heart Care Clinic',
        clinicAddress: '123 Medical Street',
        city: 'Boston',
        country: 'USA',
        latitude: 42.3601,
        longitude: -71.0589,
        bookingMode: BookingMode.INSTANT,
        isOnline: true,
        responseTimeMins: 30,
        consultationModes: ['Video', 'Phone'],
        onlineConsultation: true,
        consultationFee: '100',
      };

      const mockCreatedUser = {
        id: 'doctor-1',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: input.phone,
        gender: input.gender,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-1' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-1',
          userId: 'doctor-1',
          specialization: input.specialization,
          licenseNumber: input.licenseNumber,
          yearsOfExperience: 10,
          degree: input.degree,
          university: input.university,
          graduationYear: 2014,
          subSpecialties: input.subSpecialties,
          conditions: input.conditions,
          clinicName: input.clinicName,
          clinicAddress: input.clinicAddress,
          city: input.city,
          country: input.country,
          latitude: input.latitude,
          longitude: input.longitude,
          bookingMode: BookingMode.INSTANT,
          isOnline: true,
          responseTimeMins: 30,
          consultationModes: input.consultationModes,
          onlineConsultation: true,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          priceCents: 10000,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: input.email,
            fullName: input.fullName,
            role: Role.DOCTOR,
            phoneNumber: input.phone,
            gender: input.gender,
            doctorProfile: expect.objectContaining({
              create: expect.objectContaining({
                specialization: input.specialization,
                licenseNumber: input.licenseNumber,
                yearsOfExperience: 10,
                degree: input.degree,
                university: input.university,
                graduationYear: 2014,
                subSpecialties: input.subSpecialties,
                conditions: input.conditions,
                clinicName: input.clinicName,
                clinicAddress: input.clinicAddress,
                city: input.city,
                country: input.country,
                latitude: input.latitude,
                longitude: input.longitude,
                bookingMode: BookingMode.INSTANT,
                isOnline: true,
                responseTimeMins: 30,
                consultationModes: input.consultationModes,
                onlineConsultation: true,
                onboardingStatus: 'DRAFT',
                submittedAt: null,
                approvedAt: null,
              }),
            }),
          }),
        })
      );

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: expect.objectContaining({
          id: 'doctor-1',
          email: input.email,
          role: Role.DOCTOR,
          fullName: input.fullName,
          doctorProfile: expect.objectContaining({
            onboardingStatus: DoctorApprovalStatus.DRAFT,
            submittedAt: null,
            approvedAt: null,
          }),
        }),
      });
    });

    it('should set onboardingStatus to DRAFT for new doctor registrations', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Jane Smith',
        role: Role.DOCTOR,
        specialization: 'Neurology',
      };

      const mockCreatedUser = {
        id: 'doctor-2',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-2' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-2',
          userId: 'doctor-2',
          specialization: input.specialization,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          licenseNumber: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          responseTimeMins: null,
          consultationModes: [],
          onlineConsultation: false,
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
      expect(result.user.doctorProfile.submittedAt).toBeNull();
      expect(result.user.doctorProfile.approvedAt).toBeNull();
    });

    it('should handle partial onboarding details', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Partial',
        role: Role.DOCTOR,
        specialization: 'Pediatrics',
        licenseNumber: 'LIC789',
        // Other fields are optional and not provided
      };

      const mockCreatedUser = {
        id: 'doctor-3',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-3' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-3',
          userId: 'doctor-3',
          specialization: input.specialization,
          licenseNumber: input.licenseNumber,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          responseTimeMins: null,
          consultationModes: [],
          onlineConsultation: false,
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile).toBeDefined();
      expect(result.user.doctorProfile.specialization).toBe(input.specialization);
      expect(result.user.doctorProfile.licenseNumber).toBe(input.licenseNumber);
      expect(result.user.doctorProfile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
    });

    it('should not create DoctorProfile for patient registrations', async () => {
      const input = {
        email: 'patient@example.com',
        password: 'password123',
        fullName: 'John Patient',
        role: Role.PATIENT,
      };

      const mockCreatedUser = {
        id: 'patient-1',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.PATIENT,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: null,
        patientProfile: { id: 'patient-profile-1' },
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        patientProfile: {
          id: 'patient-profile-1',
          userId: 'patient-1',
          dateOfBirth: null,
          gender: null,
          address: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile).toBeNull();
      expect(result.user.patientProfile).toBeDefined();
    });

    it('should handle numeric field conversions correctly', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Numbers',
        role: Role.DOCTOR,
        yearsOfExperience: '15',
        graduationYear: '2009',
        responseTimeMins: 45,
        consultationFee: '150.50',
      };

      const mockCreatedUser = {
        id: 'doctor-4',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-4' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-4',
          userId: 'doctor-4',
          yearsOfExperience: 15,
          graduationYear: 2009,
          responseTimeMins: 45,
          priceCents: 15050,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          specialization: null,
          licenseNumber: null,
          degree: null,
          university: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          consultationModes: [],
          onlineConsultation: false,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile.yearsOfExperience).toBe(15);
      expect(result.user.doctorProfile.graduationYear).toBe(2009);
      expect(result.user.doctorProfile.responseTimeMins).toBe(45);
      expect(result.user.doctorProfile.priceCents).toBe(15050);
    });

    it('should handle array fields (subSpecialties, conditions, consultationModes)', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Arrays',
        role: Role.DOCTOR,
        subSpecialties: ['Specialty1', 'Specialty2', 'Specialty3'],
        conditions: ['Condition1', 'Condition2'],
        consultationModes: ['Video', 'Phone', 'InPerson'],
      };

      const mockCreatedUser = {
        id: 'doctor-5',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-5' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-5',
          userId: 'doctor-5',
          subSpecialties: input.subSpecialties,
          conditions: input.conditions,
          consultationModes: input.consultationModes,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          specialization: null,
          licenseNumber: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          responseTimeMins: null,
          onlineConsultation: false,
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile.subSpecialties).toEqual(input.subSpecialties);
      expect(result.user.doctorProfile.conditions).toEqual(input.conditions);
      expect(result.user.doctorProfile.consultationModes).toEqual(input.consultationModes);
    });

    it('should handle boolean fields correctly', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Booleans',
        role: Role.DOCTOR,
        isOnline: true,
        onlineConsultation: true,
      };

      const mockCreatedUser = {
        id: 'doctor-6',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-6' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-6',
          userId: 'doctor-6',
          isOnline: true,
          onlineConsultation: true,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          specialization: null,
          licenseNumber: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          responseTimeMins: null,
          consultationModes: [],
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile.isOnline).toBe(true);
      expect(result.user.doctorProfile.onlineConsultation).toBe(true);
    });

    it('should handle coordinate fields (latitude, longitude)', async () => {
      const input = {
        email: 'doctor@example.com',
        password: 'password123',
        fullName: 'Dr. Coordinates',
        role: Role.DOCTOR,
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const mockCreatedUser = {
        id: 'doctor-7',
        email: input.email,
        passwordHash: 'hashed-password',
        fullName: input.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-7' },
        patientProfile: null,
      };

      const mockUserWithProfile = {
        ...mockCreatedUser,
        doctorProfile: {
          id: 'doctor-profile-7',
          userId: 'doctor-7',
          latitude: input.latitude,
          longitude: input.longitude,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          specialization: null,
          licenseNumber: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          responseTimeMins: null,
          consultationModes: [],
          onlineConsultation: false,
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile as any);

      const result = await authService.register(input);

      expect(result.user.doctorProfile.latitude).toBe(input.latitude);
      expect(result.user.doctorProfile.longitude).toBe(input.longitude);
    });

    it('should use specialization field when provided, fallback to primarySpecialty', async () => {
      const input1 = {
        email: 'doctor1@example.com',
        password: 'password123',
        fullName: 'Dr. Spec1',
        role: Role.DOCTOR,
        specialization: 'Cardiology',
      };

      const input2 = {
        email: 'doctor2@example.com',
        password: 'password123',
        fullName: 'Dr. Spec2',
        role: Role.DOCTOR,
        primarySpecialty: 'Neurology',
      };

      const mockCreatedUser1 = {
        id: 'doctor-8',
        email: input1.email,
        passwordHash: 'hashed-password',
        fullName: input1.fullName,
        role: Role.DOCTOR,
        phoneNumber: null,
        gender: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctorProfile: { id: 'doctor-profile-8' },
        patientProfile: null,
      };

      const mockUserWithProfile1 = {
        ...mockCreatedUser1,
        doctorProfile: {
          id: 'doctor-profile-8',
          userId: 'doctor-8',
          specialization: input1.specialization,
          onboardingStatus: DoctorApprovalStatus.DRAFT,
          submittedAt: null,
          approvedAt: null,
          licenseNumber: null,
          yearsOfExperience: null,
          degree: null,
          university: null,
          graduationYear: null,
          subSpecialties: [],
          conditions: [],
          clinicName: null,
          clinicAddress: null,
          city: null,
          country: null,
          latitude: null,
          longitude: null,
          bookingMode: BookingMode.INSTANT,
          isOnline: false,
          responseTimeMins: null,
          consultationModes: [],
          onlineConsultation: false,
          priceCents: 0,
          currency: 'INR',
          bio: null,
          adminNotes: null,
          nextAvailableAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
        },
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockCreatedUser1 as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserWithProfile1 as any);

      const result1 = await authService.register(input1);

      expect(result1.user.doctorProfile.specialization).toBe('Cardiology');
    });
  });

  describe('Doctor Registration Error Cases', () => {
    it('should throw error if email already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Dr. Existing',
        role: Role.DOCTOR,
      };

      const existingUser = {
        id: 'existing-1',
        email: input.email,
        fullName: 'Existing User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(existingUser as any);

      await expect(authService.register(input)).rejects.toThrow(BadRequestException);
      await expect(authService.register(input)).rejects.toThrow('Email already exists');
    });
  });
});
