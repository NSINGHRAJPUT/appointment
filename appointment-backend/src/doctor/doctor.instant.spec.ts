import { Test, TestingModule } from '@nestjs/testing';
import { BookingMode, DoctorApprovalStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { DoctorService } from './doctor.service';

describe('Doctor instant availability', () => {
  let doctorService: DoctorService;
  let prisma: PrismaService;
  let userId: string;
  let doctorId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    doctorService = module.get(DoctorService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `instant-${timestamp}@test.com`,
        passwordHash: 'hashed_password',
        fullName: 'Instant Vet',
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            specialization: 'General Practice',
            onboardingStatus: DoctorApprovalStatus.APPROVED,
            bookingMode: BookingMode.INSTANT,
            isOnline: false,
            priceCents: 5000,
            licenseNumber: `LIC-INST-${timestamp}`,
          },
        },
      },
      include: { doctorProfile: true },
    });

    userId = user.id;
    doctorId = user.doctorProfile!.id;
  });

  afterEach(async () => {
    await prisma.appointment.deleteMany({ where: { doctorId } });
    await prisma.availability.deleteMany({ where: { doctorId } });
    await prisma.doctorProfile.deleteMany({ where: { id: doctorId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('lists approved instant doctors when they toggle online, without schedule match', async () => {
    await prisma.availability.create({
      data: {
        doctorId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotMins: 30,
        isActive: true,
      },
    });

    await doctorService.updateSettings(userId, { isOnline: true });

    const available = await doctorService.findAvailableForInstant();
    expect(available.some((d) => d.id === doctorId)).toBe(true);
  });

  it('sets nextAvailableAt when going online and clears it when going offline', async () => {
    const online = await doctorService.updateSettings(userId, { isOnline: true });
    expect(online.isOnline).toBe(true);
    expect(online.nextAvailableAt).not.toBeNull();

    const offline = await doctorService.updateSettings(userId, { isOnline: false });
    expect(offline.isOnline).toBe(false);
    expect(offline.nextAvailableAt).toBeNull();
  });

  it('excludes doctors not in instant booking mode', async () => {
    await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { isOnline: true, bookingMode: BookingMode.APPROVAL_REQUIRED },
    });

    const available = await doctorService.findAvailableForInstant();
    expect(available.some((d) => d.id === doctorId)).toBe(false);
  });
});
