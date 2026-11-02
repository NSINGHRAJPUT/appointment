import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { CloudinaryService } from '../common/cloudinary.service';
import { DoctorApprovalStatus, Role } from '@prisma/client';

describe('Doctor Profile Endpoints (Task 15)', () => {
  let app: INestApplication;
  let doctorService: DoctorService;
  let prisma: PrismaService;
  let testUserId: string;
  let testDoctorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        DoctorService,
        PrismaService,
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    doctorService = moduleFixture.get<DoctorService>(DoctorService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Create a test doctor user with auto-populated profile
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `doctor-${timestamp}@test.com`,
        passwordHash: 'hashed_password',
        fullName: 'Test Doctor',
        role: Role.DOCTOR,
        phoneNumber: `+1${timestamp}`,
        gender: 'Male',
        doctorProfile: {
          create: {
            specialization: 'Cardiology',
            yearsOfExperience: 10,
            clinicName: 'Test Clinic',
            city: 'New York',
            country: 'USA',
            licenseNumber: `LIC${timestamp}`,
            degree: 'MD',
            university: 'Harvard',
            graduationYear: 2010,
            onboardingStatus: DoctorApprovalStatus.DRAFT,
            priceCents: 5000,
            currency: 'USD',
            bio: 'Experienced cardiologist',
            subSpecialties: ['Interventional Cardiology'],
            conditions: ['Heart Disease'],
            latitude: 40.7128,
            longitude: -74.0060,
            bookingMode: 'INSTANT',
            isOnline: true,
            responseTimeMins: 30,
            consultationModes: ['video', 'phone'],
            onlineConsultation: true,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    testUserId = user.id;
    testDoctorId = user.doctorProfile!.id;
  });

  afterEach(async () => {
    // Clean up test data - delete in correct order to respect foreign keys
    await prisma.appointment.deleteMany({
      where: {
        doctorId: testDoctorId,
      },
    });
    await prisma.doctorProfile.deleteMany({
      where: { id: testDoctorId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /doctors/profile', () => {
    it('should return auto-populated DoctorProfile with all details', async () => {
      const profile = await doctorService.getProfile(testUserId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(testDoctorId);
      expect(profile.specialization).toBe('Cardiology');
      expect(profile.yearsOfExperience).toBe(10);
      expect(profile.clinicName).toBe('Test Clinic');
      expect(profile.city).toBe('New York');
      expect(profile.country).toBe('USA');
      expect(profile.licenseNumber).toMatch(/^LIC\d+$/);
      expect(profile.degree).toBe('MD');
      expect(profile.university).toBe('Harvard');
      expect(profile.graduationYear).toBe(2010);
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
      expect(profile.priceCents).toBe(5000);
      expect(profile.currency).toBe('USD');
      expect(profile.bio).toBe('Experienced cardiologist');
      expect(profile.subSpecialties).toContain('Interventional Cardiology');
      expect(profile.conditions).toContain('Heart Disease');
      expect(profile.latitude).toBe(40.7128);
      expect(profile.longitude).toBe(-74.0060);
      expect(profile.isOnline).toBe(true);
      expect(profile.responseTimeMins).toBe(30);
      expect(profile.consultationModes).toContain('video');
      expect(profile.onlineConsultation).toBe(true);
    });

    it('should include user details in response', async () => {
      const profile = await doctorService.getProfile(testUserId);

      expect(profile.user).toBeDefined();
      expect(profile.user.id).toBe(testUserId);
      expect(profile.user.email).toContain('@test.com');
      expect(profile.user.fullName).toBe('Test Doctor');
      expect(profile.user.phoneNumber).toMatch(/^\+1\d+$/);
      expect(profile.user.gender).toBe('Male');
    });

    it('should throw error if doctor profile not found', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(doctorService.getProfile(nonExistentUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should work with various onboarding detail combinations', async () => {
      // Create doctor with minimal details
      const minimalUser = await prisma.user.create({
        data: {
          email: `doctor-minimal-${Date.now()}@test.com`,
          passwordHash: 'hashed_password',
          fullName: 'Minimal Doctor',
          role: Role.DOCTOR,
          phoneNumber: `+1minimal${Date.now()}`,
          doctorProfile: {
            create: {
              specialization: 'General Practice',
              onboardingStatus: DoctorApprovalStatus.DRAFT,
            },
          },
        },
        include: {
          doctorProfile: true,
        },
      });

      const profile = await doctorService.getProfile(minimalUser.id);

      expect(profile).toBeDefined();
      expect(profile.specialization).toBe('General Practice');
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
      expect(profile.yearsOfExperience).toBeNull();
      expect(profile.clinicName).toBeNull();

      // Clean up
      await prisma.doctorProfile.deleteMany({
        where: { id: minimalUser.doctorProfile!.id },
      });
      await prisma.user.deleteMany({
        where: { id: minimalUser.id },
      });
    });
  });

  describe('PUT /doctors/profile', () => {
    it('should update DoctorProfile without changing onboardingStatus', async () => {
      const updateData = {
        bio: 'Updated bio',
        specialization: 'Neurology',
        yearsOfExperience: 15,
        clinicName: 'New Clinic',
        city: 'Boston',
      };

      const updated = await doctorService.updateProfile(testUserId, updateData);

      expect(updated.bio).toBe('Updated bio');
      expect(updated.specialization).toBe('Neurology');
      expect(updated.yearsOfExperience).toBe(15);
      expect(updated.clinicName).toBe('New Clinic');
      expect(updated.city).toBe('Boston');
      // onboardingStatus should remain DRAFT
      expect(updated.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
    });

    it('should update all DoctorProfile fields', async () => {
      const updateData = {
        bio: 'New bio',
        specialization: 'Orthopedics',
        subSpecialties: ['Sports Medicine', 'Joint Replacement'],
        conditions: ['Arthritis', 'Fractures'],
        degree: 'DO',
        university: 'Stanford',
        graduationYear: 2015,
        priceCents: 7500,
        currency: 'EUR',
        yearsOfExperience: 12,
        clinicName: 'Advanced Clinic',
        clinicAddress: '123 Main St',
        city: 'San Francisco',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194,
        licenseNumber: 'LIC789012',
        isOnline: false,
        responseTimeMins: 45,
        consultationModes: ['in-person'],
        onlineConsultation: false,
      };

      const updated = await doctorService.updateProfile(testUserId, updateData);

      expect(updated.bio).toBe('New bio');
      expect(updated.specialization).toBe('Orthopedics');
      expect(updated.subSpecialties).toEqual(['Sports Medicine', 'Joint Replacement']);
      expect(updated.conditions).toEqual(['Arthritis', 'Fractures']);
      expect(updated.degree).toBe('DO');
      expect(updated.university).toBe('Stanford');
      expect(updated.graduationYear).toBe(2015);
      expect(updated.priceCents).toBe(7500);
      expect(updated.currency).toBe('EUR');
      expect(updated.yearsOfExperience).toBe(12);
      expect(updated.clinicName).toBe('Advanced Clinic');
      expect(updated.clinicAddress).toBe('123 Main St');
      expect(updated.city).toBe('San Francisco');
      expect(updated.country).toBe('USA');
      expect(updated.latitude).toBe(37.7749);
      expect(updated.longitude).toBe(-122.4194);
      expect(updated.licenseNumber).toBe('LIC789012');
      expect(updated.isOnline).toBe(false);
      expect(updated.responseTimeMins).toBe(45);
      expect(updated.consultationModes).toEqual(['in-person']);
      expect(updated.onlineConsultation).toBe(false);
    });

    it('should update whatsappNumber via user relation', async () => {
      const updateData = {
        whatsappNumber: '+9876543210',
      };

      const updated = await doctorService.updateProfile(testUserId, updateData);

      // Verify the user's whatsappNumber was updated
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(user?.whatsappNumber).toBe('+9876543210');
    });

    it('should throw error if doctor profile not found', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(
        doctorService.updateProfile(nonExistentUserId, { bio: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should work with partial updates', async () => {
      const updateData = {
        bio: 'Only updating bio',
      };

      const updated = await doctorService.updateProfile(testUserId, updateData);

      expect(updated.bio).toBe('Only updating bio');
      // Other fields should remain unchanged
      expect(updated.specialization).toBe('Cardiology');
      expect(updated.yearsOfExperience).toBe(10);
      expect(updated.clinicName).toBe('Test Clinic');
    });

    it('should work with various onboarding detail combinations', async () => {
      const updateData = {
        specialization: 'Pediatrics',
        yearsOfExperience: 8,
        clinicName: 'Children\'s Hospital',
        city: 'Chicago',
        country: 'USA',
        priceCents: 4000,
        currency: 'USD',
      };

      const updated = await doctorService.updateProfile(testUserId, updateData);

      expect(updated.specialization).toBe('Pediatrics');
      expect(updated.yearsOfExperience).toBe(8);
      expect(updated.clinicName).toBe('Children\'s Hospital');
      expect(updated.city).toBe('Chicago');
      expect(updated.country).toBe('USA');
      expect(updated.priceCents).toBe(4000);
      expect(updated.currency).toBe('USD');
    });
  });

  describe('PATCH /doctors/onboarding/submit', () => {
    it('should update onboardingStatus to SUBMITTED and set submittedAt', async () => {
      const submitted = await doctorService.submitOnboarding(testUserId);

      expect(submitted.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);
      expect(submitted.submittedAt).toBeDefined();
      expect(submitted.submittedAt).toBeInstanceOf(Date);
      expect(submitted.submittedAt!.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve all other profile fields when submitting', async () => {
      const submitted = await doctorService.submitOnboarding(testUserId);

      expect(submitted.specialization).toBe('Cardiology');
      expect(submitted.yearsOfExperience).toBe(10);
      expect(submitted.clinicName).toBe('Test Clinic');
      expect(submitted.city).toBe('New York');
      expect(submitted.country).toBe('USA');
      expect(submitted.licenseNumber).toMatch(/^LIC\d+$/);
      expect(submitted.degree).toBe('MD');
      expect(submitted.university).toBe('Harvard');
      expect(submitted.graduationYear).toBe(2010);
      expect(submitted.priceCents).toBe(5000);
      expect(submitted.currency).toBe('USD');
      expect(submitted.bio).toBe('Experienced cardiologist');
    });

    it('should throw error if doctor profile not found', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(doctorService.submitOnboarding(nonExistentUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should work when submitting from DRAFT status', async () => {
      // Verify initial status is DRAFT
      let profile = await doctorService.getProfile(testUserId);
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);

      // Submit for approval
      const submitted = await doctorService.submitOnboarding(testUserId);
      expect(submitted.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);

      // Verify status persists
      profile = await doctorService.getProfile(testUserId);
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);
    });

    it('should set submittedAt timestamp correctly', async () => {
      const beforeSubmit = new Date();
      const submitted = await doctorService.submitOnboarding(testUserId);
      const afterSubmit = new Date();

      expect(submitted.submittedAt).toBeDefined();
      expect(submitted.submittedAt!.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
      expect(submitted.submittedAt!.getTime()).toBeLessThanOrEqual(afterSubmit.getTime());
    });
  });

  describe('Integration: Profile Update Flow', () => {
    it('should allow updating profile multiple times without changing onboardingStatus', async () => {
      // First update
      let updated = await doctorService.updateProfile(testUserId, {
        bio: 'First update',
      });
      expect(updated.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);

      // Second update
      updated = await doctorService.updateProfile(testUserId, {
        bio: 'Second update',
        specialization: 'Neurology',
      });
      expect(updated.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
      expect(updated.bio).toBe('Second update');
      expect(updated.specialization).toBe('Neurology');

      // Third update
      updated = await doctorService.updateProfile(testUserId, {
        yearsOfExperience: 20,
      });
      expect(updated.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
      expect(updated.yearsOfExperience).toBe(20);
    });

    it('should allow updating profile after submission', async () => {
      // Submit for approval
      let submitted = await doctorService.submitOnboarding(testUserId);
      expect(submitted.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);

      // Update profile (should not change status)
      const updated = await doctorService.updateProfile(testUserId, {
        bio: 'Updated after submission',
      });
      expect(updated.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);
      expect(updated.bio).toBe('Updated after submission');
    });

    it('should work with complete onboarding workflow', async () => {
      // 1. Get initial profile (DRAFT)
      let profile = await doctorService.getProfile(testUserId);
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);

      // 2. Update profile details
      await doctorService.updateProfile(testUserId, {
        bio: 'Complete profile',
        yearsOfExperience: 15,
      });

      // 3. Submit for approval
      const submitted = await doctorService.submitOnboarding(testUserId);
      expect(submitted.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);
      expect(submitted.submittedAt).toBeDefined();

      // 4. Verify final state
      profile = await doctorService.getProfile(testUserId);
      expect(profile.onboardingStatus).toBe(DoctorApprovalStatus.SUBMITTED);
      expect(profile.bio).toBe('Complete profile');
      expect(profile.yearsOfExperience).toBe(15);
    });
  });
});
