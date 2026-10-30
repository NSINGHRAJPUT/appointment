import {
  AppointmentStatus,
  BookingMode,
  DoctorApprovalStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'demo.vet@pawcare.demo' },
    update: { passwordHash },
    create: {
      email: 'demo.vet@pawcare.demo',
      fullName: 'Demo Vet',
      role: Role.DOCTOR,
      passwordHash,
      phoneNumber: '+919900000001',
      doctorProfile: {
        create: {
          specialization: 'General Practice',
          clinicName: 'PawCare Demo Clinic',
          city: 'Mumbai',
          onboardingStatus: DoctorApprovalStatus.APPROVED,
          bookingMode: BookingMode.APPROVAL_REQUIRED,
          onlineConsultation: true,
          isOnline: true,
          approvedAt: new Date(),
        },
      },
    },
    include: { doctorProfile: true },
  });

  let doctorProfile = doctorUser.doctorProfile;
  if (!doctorProfile) {
    doctorProfile = await prisma.doctorProfile.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        specialization: 'General Practice',
        clinicName: 'PawCare Demo Clinic',
        city: 'Mumbai',
        onboardingStatus: DoctorApprovalStatus.APPROVED,
        bookingMode: BookingMode.APPROVAL_REQUIRED,
        onlineConsultation: true,
        isOnline: true,
        approvedAt: new Date(),
      },
    });
  }

  const patientUser = await prisma.user.upsert({
    where: { email: 'demo.patient@pawcare.demo' },
    update: { passwordHash },
    create: {
      email: 'demo.patient@pawcare.demo',
      fullName: 'Demo Patient',
      role: Role.PATIENT,
      passwordHash,
      phoneNumber: '+919900000002',
      patientProfile: { create: {} },
    },
    include: { patientProfile: true },
  });

  let patientProfile = patientUser.patientProfile;
  if (!patientProfile) {
    patientProfile = await prisma.patientProfile.upsert({
      where: { userId: patientUser.id },
      update: {},
      create: { userId: patientUser.id },
    });
  }

  const startAt = new Date(Date.now() + 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);

  const existing = await prisma.appointment.findFirst({
    where: {
      doctorId: doctorProfile.id,
      patientId: patientProfile.id,
      status: AppointmentStatus.CONFIRMED,
    },
  });

  const appt =
    existing ??
    (await prisma.appointment.create({
      data: {
        doctorId: doctorProfile.id,
        patientId: patientProfile.id,
        patientName: patientUser.fullName,
        patientPhone: patientUser.phoneNumber ?? '+919900000002',
        patientEmail: patientUser.email,
        startAt,
        endAt,
        status: AppointmentStatus.CONFIRMED,
        conversation: { create: {} },
      },
    }));

  console.log(
    JSON.stringify(
      {
        doctor: doctorUser.email,
        patient: patientUser.email,
        appointmentId: appt.id,
        password: 'password123',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
