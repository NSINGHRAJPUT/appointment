import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { NotificationService } from '../notification/notification.service';
import { Role, DoctorApprovalStatus } from '@prisma/client';

describe('Admin User Management (Tasks 16-17)', () => {
  let app: INestApplication;
  let adminService: AdminService;
  let prisma: PrismaService;
  let adminUserId: string;
  let doctorUserId: string;
  let patientUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        PrismaService,
        {
          provide: NotificationService,
          useValue: { createForUsers: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    adminService = moduleFixture.get<AdminService>(AdminService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Create test admin user
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        passwordHash: 'hashed_password',
        fullName: 'Test Admin',
        role: Role.ADMIN,
        phoneNumber: `+1admin${Date.now()}`,
      },
    });
    adminUserId = adminUser.id;

    // Create test doctor user
    const doctorUser = await prisma.user.create({
      data: {
        email: `doctor-${Date.now()}@test.com`,
        passwordHash: 'hashed_password',
        fullName: 'Test Doctor',
        role: Role.DOCTOR,
        phoneNumber: `+1doctor${Date.now()}`,
        doctorProfile: {
          create: {
            specialization: 'Cardiology',
            yearsOfExperience: 10,
            clinicName: 'Test Clinic',
            city: 'New York',
            country: 'USA',
            licenseNumber: `LIC${Date.now()}`,
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
    doctorUserId = doctorUser.id;

    // Create test patient user
    const patientUser = await prisma.user.create({
      data: {
        email: `patient-${Date.now()}@test.com`,
        passwordHash: 'hashed_password',
        fullName: 'Test Patient',
        role: Role.PATIENT,
        phoneNumber: `+1patient${Date.now()}`,
        patientProfile: {
          create: {
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Female',
            address: '123 Main St, New York, NY',
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });
    patientUserId = patientUser.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.availability.deleteMany({});
    await prisma.doctorDocument.deleteMany({});
    await prisma.doctorProfile.deleteMany({});
    await prisma.patientProfile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Task 16: PATCH /admin/users/:userId/profile', () => {
    it('should update doctor user profile with all fields', async () => {
      const updateData = {
        email: `updated-doctor-${Date.now()}@test.com`,
        fullName: 'Updated Doctor',
        phoneNumber: `+1updated${Date.now()}`,
        bio: 'Updated bio',
        specialization: 'Neurology',
        yearsOfExperience: 15,
        clinicName: 'New Clinic',
        city: 'Boston',
        country: 'USA',
        priceCents: 7500,
        currency: 'EUR',
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.email).toBe(updateData.email);
      expect(updated.fullName).toBe(updateData.fullName);
      expect(updated.phoneNumber).toBe(updateData.phoneNumber);
      expect(updated.doctorProfile?.bio).toBe(updateData.bio);
      expect(updated.doctorProfile?.specialization).toBe(updateData.specialization);
      expect(updated.doctorProfile?.yearsOfExperience).toBe(updateData.yearsOfExperience);
      expect(updated.doctorProfile?.clinicName).toBe(updateData.clinicName);
      expect(updated.doctorProfile?.city).toBe(updateData.city);
      expect(updated.doctorProfile?.country).toBe(updateData.country);
      expect(updated.doctorProfile?.priceCents).toBe(updateData.priceCents);
      expect(updated.doctorProfile?.currency).toBe(updateData.currency);
    });

    it('should update patient user profile with all fields', async () => {
      const updateData = {
        email: `updated-patient-${Date.now()}@test.com`,
        fullName: 'Updated Patient',
        phoneNumber: `+1updated${Date.now()}`,
        gender: 'Male',
        dateOfBirth: new Date('1985-05-15'),
        address: '456 Oak Ave, Boston, MA',
      };

      const updated = await adminService.updateUserProfile(adminUserId, patientUserId, updateData);

      expect(updated.email).toBe(updateData.email);
      expect(updated.fullName).toBe(updateData.fullName);
      expect(updated.phoneNumber).toBe(updateData.phoneNumber);
      expect(updated.gender).toBe(updateData.gender);
      expect(updated.patientProfile?.dateOfBirth).toEqual(updateData.dateOfBirth);
      expect(updated.patientProfile?.address).toBe(updateData.address);
    });

    it('should update doctor onboarding status to APPROVED and set approvedAt', async () => {
      const updateData = {
        onboardingStatus: DoctorApprovalStatus.APPROVED,
        adminNotes: 'Approved by admin',
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.APPROVED);
      expect(updated.doctorProfile?.adminNotes).toBe(updateData.adminNotes);
      expect(updated.doctorProfile?.approvedAt).toBeDefined();
      expect(updated.doctorProfile?.approvedAt).toBeInstanceOf(Date);
    });

    it('should update doctor onboarding status to REJECTED', async () => {
      const updateData = {
        onboardingStatus: DoctorApprovalStatus.REJECTED,
        adminNotes: 'Rejected due to incomplete documentation',
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.REJECTED);
      expect(updated.doctorProfile?.adminNotes).toBe(updateData.adminNotes);
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
        licenseNumber: `LIC${Date.now()}`,
        isOnline: false,
        responseTimeMins: 45,
        consultationModes: ['in-person'],
        onlineConsultation: false,
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.doctorProfile?.bio).toBe(updateData.bio);
      expect(updated.doctorProfile?.specialization).toBe(updateData.specialization);
      expect(updated.doctorProfile?.subSpecialties).toEqual(updateData.subSpecialties);
      expect(updated.doctorProfile?.conditions).toEqual(updateData.conditions);
      expect(updated.doctorProfile?.degree).toBe(updateData.degree);
      expect(updated.doctorProfile?.university).toBe(updateData.university);
      expect(updated.doctorProfile?.graduationYear).toBe(updateData.graduationYear);
      expect(updated.doctorProfile?.priceCents).toBe(updateData.priceCents);
      expect(updated.doctorProfile?.currency).toBe(updateData.currency);
      expect(updated.doctorProfile?.yearsOfExperience).toBe(updateData.yearsOfExperience);
      expect(updated.doctorProfile?.clinicName).toBe(updateData.clinicName);
      expect(updated.doctorProfile?.clinicAddress).toBe(updateData.clinicAddress);
      expect(updated.doctorProfile?.city).toBe(updateData.city);
      expect(updated.doctorProfile?.country).toBe(updateData.country);
      expect(updated.doctorProfile?.latitude).toBe(updateData.latitude);
      expect(updated.doctorProfile?.longitude).toBe(updateData.longitude);
      expect(updated.doctorProfile?.isOnline).toBe(updateData.isOnline);
      expect(updated.doctorProfile?.responseTimeMins).toBe(updateData.responseTimeMins);
      expect(updated.doctorProfile?.consultationModes).toEqual(updateData.consultationModes);
      expect(updated.doctorProfile?.onlineConsultation).toBe(updateData.onlineConsultation);
    });

    it('should update User base fields', async () => {
      const updateData = {
        email: `updated-${Date.now()}@test.com`,
        phoneNumber: `+1updated${Date.now()}`,
        fullName: 'Updated Name',
        whatsappNumber: '+1234567890',
        gender: 'Other',
        isActive: false,
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.email).toBe(updateData.email);
      expect(updated.phoneNumber).toBe(updateData.phoneNumber);
      expect(updated.fullName).toBe(updateData.fullName);
      expect(updated.whatsappNumber).toBe(updateData.whatsappNumber);
      expect(updated.gender).toBe(updateData.gender);
      expect(updated.isActive).toBe(updateData.isActive);
    });

    it('should throw error if user not found', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(
        adminService.updateUserProfile(adminUserId, nonExistentUserId, { fullName: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should work with partial updates', async () => {
      const updateData = {
        bio: 'Only updating bio',
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated.doctorProfile?.bio).toBe(updateData.bio);
      // Other fields should remain unchanged
      expect(updated.doctorProfile?.specialization).toBe('Cardiology');
      expect(updated.doctorProfile?.yearsOfExperience).toBe(10);
    });

    it('should log audit trail for changes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const updateData = {
        bio: 'Updated bio',
        specialization: 'Neurology',
      };

      await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.objectContaining({
          timestamp: expect.any(String),
          changes: expect.objectContaining({
            bio: 'Updated bio',
            specialization: 'Neurology',
          }),
        }),
      );

      consoleSpy.mockRestore();
    });

    it('should return updated user with all nested data', async () => {
      const updateData = {
        bio: 'Updated bio',
      };

      const updated = await adminService.updateUserProfile(adminUserId, doctorUserId, updateData);

      expect(updated).toBeDefined();
      expect(updated.id).toBe(doctorUserId);
      expect(updated.doctorProfile).toBeDefined();
      expect(updated.doctorProfile?.documents).toBeDefined();
      expect(updated.doctorProfile?.availabilities).toBeDefined();
      expect(updated.doctorProfile?.appointments).toBeDefined();
    });
  });

  describe('Task 17: GET /admin/users/:userId', () => {
    it('should return complete doctor user profile with all nested relations', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(doctorUserId);
      expect(profile.email).toContain('@test.com');
      expect(profile.fullName).toBe('Test Doctor');
      expect(profile.role).toBe(Role.DOCTOR);
      expect(profile.doctorProfile).toBeDefined();
      expect(profile.doctorProfile?.specialization).toBe('Cardiology');
      expect(profile.doctorProfile?.yearsOfExperience).toBe(10);
      expect(profile.doctorProfile?.documents).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.documents)).toBe(true);
      expect(profile.doctorProfile?.availabilities).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.availabilities)).toBe(true);
      expect(profile.doctorProfile?.appointments).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.appointments)).toBe(true);
    });

    it('should return complete patient user profile with all nested relations', async () => {
      const profile = await adminService.getUserDetails(patientUserId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(patientUserId);
      expect(profile.email).toContain('@test.com');
      expect(profile.fullName).toBe('Test Patient');
      expect(profile.role).toBe(Role.PATIENT);
      expect(profile.patientProfile).toBeDefined();
      expect(profile.patientProfile?.dateOfBirth).toEqual(new Date('1990-01-01'));
      expect(profile.patientProfile?.gender).toBe('Female');
      expect(profile.patientProfile?.address).toBe('123 Main St, New York, NY');
      expect(profile.patientProfile?.appointments).toBeDefined();
      expect(Array.isArray(profile.patientProfile?.appointments)).toBe(true);
    });

    it('should include all DoctorProfile fields', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile.doctorProfile).toBeDefined();
      expect(profile.doctorProfile?.id).toBeDefined();
      expect(profile.doctorProfile?.bio).toBe('Experienced cardiologist');
      expect(profile.doctorProfile?.specialization).toBe('Cardiology');
      expect(profile.doctorProfile?.subSpecialties).toEqual(['Interventional Cardiology']);
      expect(profile.doctorProfile?.conditions).toEqual(['Heart Disease']);
      expect(profile.doctorProfile?.degree).toBe('MD');
      expect(profile.doctorProfile?.university).toBe('Harvard');
      expect(profile.doctorProfile?.graduationYear).toBe(2010);
      expect(profile.doctorProfile?.priceCents).toBe(5000);
      expect(profile.doctorProfile?.currency).toBe('USD');
      expect(profile.doctorProfile?.yearsOfExperience).toBe(10);
      expect(profile.doctorProfile?.clinicName).toBe('Test Clinic');
      expect(profile.doctorProfile?.city).toBe('New York');
      expect(profile.doctorProfile?.country).toBe('USA');
      expect(profile.doctorProfile?.latitude).toBe(40.7128);
      expect(profile.doctorProfile?.longitude).toBe(-74.0060);
      expect(profile.doctorProfile?.licenseNumber).toMatch(/^LIC\d+$/);
      expect(profile.doctorProfile?.bookingMode).toBe('INSTANT');
      expect(profile.doctorProfile?.isOnline).toBe(true);
      expect(profile.doctorProfile?.responseTimeMins).toBe(30);
      expect(profile.doctorProfile?.consultationModes).toEqual(['video', 'phone']);
      expect(profile.doctorProfile?.onlineConsultation).toBe(true);
      expect(profile.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);
    });

    it('should include all PatientProfile fields', async () => {
      const profile = await adminService.getUserDetails(patientUserId);

      expect(profile.patientProfile).toBeDefined();
      expect(profile.patientProfile?.id).toBeDefined();
      expect(profile.patientProfile?.dateOfBirth).toEqual(new Date('1990-01-01'));
      expect(profile.patientProfile?.gender).toBe('Female');
      expect(profile.patientProfile?.address).toBe('123 Main St, New York, NY');
      expect(profile.patientProfile?.createdAt).toBeDefined();
      expect(profile.patientProfile?.updatedAt).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(adminService.getUserDetails(nonExistentUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return user with all base fields', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(doctorUserId);
      expect(profile.fullName).toBe('Test Doctor');
      expect(profile.email).toContain('@test.com');
      expect(profile.phoneNumber).toMatch(/^\+1doctor/);
      expect(profile.role).toBe(Role.DOCTOR);
      expect(profile.isActive).toBe(true);
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it('should include nested documents for doctor', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile.doctorProfile?.documents).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.documents)).toBe(true);
      // Each document should have these fields
      if (profile.doctorProfile?.documents && profile.doctorProfile.documents.length > 0) {
        expect(profile.doctorProfile.documents[0]).toHaveProperty('id');
        expect(profile.doctorProfile.documents[0]).toHaveProperty('title');
        expect(profile.doctorProfile.documents[0]).toHaveProperty('fileUrl');
        expect(profile.doctorProfile.documents[0]).toHaveProperty('createdAt');
      }
    });

    it('should include nested availabilities for doctor', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile.doctorProfile?.availabilities).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.availabilities)).toBe(true);
    });

    it('should include nested appointments for doctor', async () => {
      const profile = await adminService.getUserDetails(doctorUserId);

      expect(profile.doctorProfile?.appointments).toBeDefined();
      expect(Array.isArray(profile.doctorProfile?.appointments)).toBe(true);
    });

    it('should include nested appointments for patient', async () => {
      const profile = await adminService.getUserDetails(patientUserId);

      expect(profile.patientProfile?.appointments).toBeDefined();
      expect(Array.isArray(profile.patientProfile?.appointments)).toBe(true);
    });
  });

  describe('Integration: Admin User Management Workflow', () => {
    it('should allow admin to view and update doctor profile', async () => {
      // 1. Get doctor profile
      let profile = await adminService.getUserDetails(doctorUserId);
      expect(profile.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);

      // 2. Update doctor profile
      await adminService.updateUserProfile(adminUserId, doctorUserId, {
        bio: 'Updated bio',
        yearsOfExperience: 15,
      });

      // 3. Verify updates
      profile = await adminService.getUserDetails(doctorUserId);
      expect(profile.doctorProfile?.bio).toBe('Updated bio');
      expect(profile.doctorProfile?.yearsOfExperience).toBe(15);
    });

    it('should allow admin to approve doctor onboarding', async () => {
      // 1. Get initial profile
      let profile = await adminService.getUserDetails(doctorUserId);
      expect(profile.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.DRAFT);

      // 2. Approve doctor
      await adminService.updateUserProfile(adminUserId, doctorUserId, {
        onboardingStatus: DoctorApprovalStatus.APPROVED,
        adminNotes: 'Approved',
      });

      // 3. Verify approval
      profile = await adminService.getUserDetails(doctorUserId);
      expect(profile.doctorProfile?.onboardingStatus).toBe(DoctorApprovalStatus.APPROVED);
      expect(profile.doctorProfile?.approvedAt).toBeDefined();
      expect(profile.doctorProfile?.adminNotes).toBe('Approved');
    });

    it('should allow admin to manage patient profile', async () => {
      // 1. Get patient profile
      let profile = await adminService.getUserDetails(patientUserId);
      expect(profile.patientProfile?.address).toBe('123 Main St, New York, NY');

      // 2. Update patient profile
      await adminService.updateUserProfile(adminUserId, patientUserId, {
        address: '789 Elm St, Boston, MA',
        dateOfBirth: new Date('1995-06-20'),
      });

      // 3. Verify updates
      profile = await adminService.getUserDetails(patientUserId);
      expect(profile.patientProfile?.address).toBe('789 Elm St, Boston, MA');
      expect(profile.patientProfile?.dateOfBirth).toEqual(new Date('1995-06-20'));
    });
  });
});
