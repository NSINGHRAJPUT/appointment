import {
  PrismaClient,
  Role,
  AppointmentStatus,
  DoctorApprovalStatus,
  MessageType,
  CallType,
  PaymentStatus,
  EmailStatus,
  BookingMode,
  BlogStatus,
  OtpType,
  OtpStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Scale targets (demo / client showcase) ───────────────────────────────
const COUNTS = {
  admins: 2,
  doctorsApproved: 105,
  doctorsSubmitted: 12,
  doctorsDraft: 8,
  doctorsRejected: 5,
  patients: 280,
  appointments: 550,
  reviews: 140,
  conversations: 120,
  messagesPerConversation: 4,
  callSessions: 90,
  emailLogs: 150,
  blogPosts: 18,
  otpRecords: 8,
};

const PASSWORD = 'password123';

const PET_SPECIALTIES = [
  'General Practice',
  'Surgery',
  'Dermatology',
  'Dentistry',
  'Emergency Care',
  'Nutrition',
  'Behavior',
  'Exotic Pets',
  'Cardiology',
  'Neurology',
  'Ophthalmology',
  'Orthopedics',
] as const;

const CITIES = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
];

const CLINIC_PREFIXES = [
  'PawCare',
  'Happy Tails',
  'PetWell',
  'Furry Friends',
  'Whiskers & Paws',
  'TailWag',
  'Healthy Paws',
  'PetGuardian',
  'VetNest',
  'Animal Ark',
];

const PET_SPECIES = ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Reptiles', 'Small mammals'];
const SUB_SPECIALTIES = [
  'Puppy & kitten care',
  'Senior pet wellness',
  'Vaccination programs',
  'Post-surgery recovery',
  'Weight management',
  'Anxiety & stress',
  'Dental hygiene',
  'Chronic disease management',
];

const VISIT_REASONS = [
  'Annual vaccination and wellness check',
  'Skin irritation and excessive scratching',
  'Loss of appetite for 3 days',
  'Limping on front left paw',
  'Dental cleaning and oral exam',
  'Follow-up after surgery',
  'Behavioral issues — aggression toward visitors',
  'Ear infection symptoms',
  'Nutrition plan for overweight pet',
  'Emergency — vomiting and lethargy',
  'Eye discharge and redness',
  'Routine spay/neuter consultation',
  'Flea and tick prevention review',
  'Joint pain in senior dog',
  'New puppy first visit',
];

const REVIEW_COMMENTS = [
  'Very compassionate with our anxious rescue dog. Highly recommend!',
  'Clear explanation of treatment options. Our cat is doing much better.',
  'Quick video consult and practical advice. Saved us a stressful trip.',
  'Thorough examination and friendly staff at the clinic.',
  'Helped us switch to a better diet plan — visible improvement in 2 weeks.',
  'Professional, patient, and genuinely cares about animals.',
  'Emergency slot was available same day. Grateful for the support.',
  'Great with exotic pets — rare to find such expertise locally.',
  'Follow-up messages were thoughtful. PawCare made booking easy.',
  'Our parrot is thriving after the nutrition consult.',
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karan', 'Dev', 'Nikhil',
  'Priya', 'Ananya', 'Meera', 'Riya', 'Sneha', 'Kavya', 'Isha', 'Neha',
  'Rajesh', 'Suresh', 'Amit', 'Vikram', 'Sanjay', 'Rahul', 'Manish', 'Deepak',
  'Lakshmi', 'Pooja', 'Shreya', 'Divya', 'Nandini', 'Swati',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Gupta',
  'Mehta', 'Joshi', 'Kapoor', 'Malhotra', 'Chopra', 'Bansal', 'Agarwal', 'Verma',
  'Das', 'Roy', 'Pillai', 'Menon', 'Kulkarni', 'Desai', 'Bhatt', 'Saxena',
];

const UNIVERSITIES = [
  'Mumbai Veterinary College',
  'IVRI Bareilly',
  'MAFSU Nagpur',
  'WBUAFS Kolkata',
  'KVAFSU Bidar',
  'TANUVAS Chennai',
  'LUVAS Hisar',
];

const BLOG_TOPICS = [
  {
    title: '10 Signs Your Dog Needs a Vet Visit',
    category: 'Wellness',
    excerpt: 'Learn the subtle symptoms pet parents often miss before a condition worsens.',
  },
  {
    title: 'Kitten Vaccination Schedule Explained',
    category: 'Preventive Care',
    excerpt: 'A month-by-month guide to core vaccines and booster timing for new kittens.',
  },
  {
    title: 'Managing Pet Anxiety During Fireworks',
    category: 'Behavior',
    excerpt: 'Practical calming techniques vets recommend for noise-sensitive pets.',
  },
  {
    title: 'Homemade vs Commercial Pet Food',
    category: 'Nutrition',
    excerpt: 'What veterinary nutritionists want you to know before changing your pet\'s diet.',
  },
  {
    title: 'Dental Care at Home for Cats',
    category: 'Dentistry',
    excerpt: 'Step-by-step tips to reduce tartar buildup between professional cleanings.',
  },
  {
    title: 'When Is Limping an Emergency?',
    category: 'Emergency Care',
    excerpt: 'How to tell if your pet needs immediate care or can wait for a scheduled visit.',
  },
  {
    title: 'Introducing a New Pet to Your Household',
    category: 'Behavior',
    excerpt: 'Slow introduction strategies that reduce stress for dogs, cats, and existing pets.',
  },
  {
    title: 'Summer Heat Safety for Dogs',
    category: 'Wellness',
    excerpt: 'Prevent heatstroke with these vet-approved walking and hydration guidelines.',
  },
  {
    title: 'Understanding Pet Insurance in India',
    category: 'Pet Parent Guide',
    excerpt: 'Coverage types, exclusions, and how to choose a plan that fits your pet\'s needs.',
  },
  {
    title: 'Rabbit Care Basics for First-Time Owners',
    category: 'Exotic Pets',
    excerpt: 'Housing, diet, and health checks every bunny parent should know.',
  },
  {
    title: 'Skin Allergies in Dogs: Causes & Relief',
    category: 'Dermatology',
    excerpt: 'From food sensitivities to environmental triggers — a vet\'s overview.',
  },
  {
    title: 'Senior Pet Wellness Checks',
    category: 'Wellness',
    excerpt: 'Why twice-yearly exams matter for aging dogs and cats.',
  },
  {
    title: 'Parrot Nutrition: Seeds Aren\'t Enough',
    category: 'Exotic Pets',
    excerpt: 'Balanced diets for companion birds recommended by avian specialists.',
  },
  {
    title: 'Post-Surgery Care at Home',
    category: 'Surgery',
    excerpt: 'Wound monitoring, activity restriction, and when to call your vet.',
  },
  {
    title: 'Flea & Tick Season Preparedness',
    category: 'Preventive Care',
    excerpt: 'Prevention products and home treatments that actually work.',
  },
  {
    title: 'Cat Obesity: A Growing Concern',
    category: 'Nutrition',
    excerpt: 'Portion control, play enrichment, and healthy weight targets.',
  },
  {
    title: 'Choosing the Right Vet for Your Pet',
    category: 'Pet Parent Guide',
    excerpt: 'Questions to ask and credentials to look for when building a care team.',
  },
  {
    title: 'PawCare Platform: How Online Vet Consults Work',
    category: 'PawCare',
    excerpt: 'Book instant or scheduled visits, chat with your vet, and manage records in one place.',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[] | T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseHHmm(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function phoneFor(index: number): string {
  return String(7000000000 + index).slice(-10);
}

function emailFor(role: string, index: number): string {
  return `${role}.${index}@pawcare.demo`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function addMins(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function daysFromNow(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function alignToWeekday(date: Date, dayOfWeek: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== dayOfWeek) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

type AvailRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins: number;
};

type DoctorRecord = {
  userId: string;
  profileId: string;
  userFullName: string;
  doctorUserId: string;
  specialization: string;
  priceCents: number;
  bookingMode: BookingMode;
  isOnline: boolean;
  onboardingStatus: DoctorApprovalStatus;
  availabilities: AvailRow[];
};

type PatientRecord = {
  userId: string;
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
};

function buildAvailability(specialty: string): AvailRow[] {
  const slotMins =
    specialty === 'Emergency Care' ? 20 : specialty === 'Surgery' ? 45 : 30;
  const patterns: AvailRow[][] = [
    [
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotMins },
      { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotMins },
      { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', slotMins },
    ],
    [
      { dayOfWeek: 2, startTime: '10:00', endTime: '14:00', slotMins },
      { dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotMins },
    ],
    [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotMins },
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00', slotMins },
      { dayOfWeek: 4, startTime: '15:00', endTime: '19:00', slotMins },
    ],
    [
      { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', slotMins },
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotMins },
    ],
  ];
  return pick(patterns);
}

function priceForSpecialty(specialty: string): number {
  const map: Record<string, number> = {
    'General Practice': 49900,
    'Surgery': 250000,
    Dermatology: 89900,
    Dentistry: 79900,
    'Emergency Care': 149900,
    Nutrition: 59900,
    Behavior: 99900,
    'Exotic Pets': 119900,
    Cardiology: 199900,
    Neurology: 179900,
    Ophthalmology: 129900,
    Orthopedics: 219900,
  };
  const base = map[specialty] ?? 69900;
  return base + randInt(-5, 15) * 1000;
}

function pickSlot(
  doctor: DoctorRecord,
  dayOffset: number,
  usedKeys: Set<string>,
): { startAt: Date; endAt: Date } | null {
  if (doctor.availabilities.length === 0) return null;

  for (let attempt = 0; attempt < 40; attempt++) {
    const avail = pick(doctor.availabilities);
    const base = alignToWeekday(daysFromNow(dayOffset), avail.dayOfWeek);
    const startMins = parseHHmm(avail.startTime);
    const endMins = parseHHmm(avail.endTime);
    const slots: number[] = [];
    for (let m = startMins; m + avail.slotMins <= endMins; m += avail.slotMins) {
      slots.push(m);
    }
    if (slots.length === 0) continue;

    const slotStartMins = pick(slots);
    const startAt = addMins(base, slotStartMins);
    const endAt = addMins(startAt, avail.slotMins);
    const key = `${doctor.profileId}:${startAt.toISOString()}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    return { startAt, endAt };
  }
  return null;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🐾 PawCare — seeding demo database...\n');

  console.log('🗑️  Clearing existing data...');
  await prisma.emailLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.callSession.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorDocument.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.staticPage.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleared\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  let phoneCounter = 1;

  // ── Admins ──────────────────────────────────────────────────────────────
  console.log('👤 Creating admins...');
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@pawcare.demo',
        passwordHash,
        fullName: 'PawCare Super Admin',
        role: Role.ADMIN,
        phoneNumber: phoneFor(phoneCounter++),
        gender: 'Prefer not to say',
      },
      {
        email: 'ops@pawcare.demo',
        passwordHash,
        fullName: 'Operations Manager',
        role: Role.ADMIN,
        phoneNumber: phoneFor(phoneCounter++),
        gender: 'Female',
      },
    ],
  });
  console.log(`✅ ${COUNTS.admins} admins\n`);

  // ── Doctors ─────────────────────────────────────────────────────────────
  console.log('🩺 Creating veterinarians...');
  const doctors: DoctorRecord[] = [];
  const statusPlan: DoctorApprovalStatus[] = [
    ...Array(COUNTS.doctorsApproved).fill(DoctorApprovalStatus.APPROVED),
    ...Array(COUNTS.doctorsSubmitted).fill(DoctorApprovalStatus.SUBMITTED),
    ...Array(COUNTS.doctorsDraft).fill(DoctorApprovalStatus.DRAFT),
    ...Array(COUNTS.doctorsRejected).fill(DoctorApprovalStatus.REJECTED),
  ];

  let doctorIndex = 0;
  for (const status of statusPlan) {
    doctorIndex++;
    const specialty = PET_SPECIALTIES[doctorIndex % PET_SPECIALTIES.length];
    const city = CITIES[doctorIndex % CITIES.length];
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const fullName = `Dr. ${first} ${last}`;
    const isApproved = status === DoctorApprovalStatus.APPROVED;
    const bookingMode =
      isApproved && doctorIndex % 3 !== 0
        ? BookingMode.INSTANT
        : BookingMode.APPROVAL_REQUIRED;
    const isOnline = isApproved && bookingMode === BookingMode.INSTANT && doctorIndex % 5 === 0;
    const availabilities = isApproved ? buildAvailability(specialty) : [];
    const priceCents = isApproved ? priceForSpecialty(specialty) : 0;
    const years = isApproved ? randInt(3, 22) : randInt(1, 4);

    const user = await prisma.user.create({
      data: {
        email: doctorIndex === 1 ? 'demo.vet@pawcare.demo' : emailFor('vet', doctorIndex),
        passwordHash,
        fullName,
        role: Role.DOCTOR,
        phoneNumber: phoneFor(phoneCounter++),
        gender: doctorIndex % 2 === 0 ? 'Female' : 'Male',
        doctorProfile: {
          create: {
            bio: `${specialty} veterinarian serving ${city.name} — ${years}+ years caring for dogs, cats, and companion animals.`,
            specialization: specialty,
            subSpecialties: pickN(SUB_SPECIALTIES, randInt(2, 4)),
            conditions: pickN(PET_SPECIES, randInt(2, 4)),
            degree: pick(['BVSc', 'MVSc', 'BVSc & AH']),
            university: pick(UNIVERSITIES),
            graduationYear: 2026 - years - randInt(22, 28),
            priceCents,
            currency: 'INR',
            yearsOfExperience: years,
            clinicName: `${pick(CLINIC_PREFIXES)} ${city.name}`,
            clinicAddress: `${randInt(1, 199)} Pet Care Lane, ${city.name}`,
            city: city.name,
            country: 'India',
            latitude: city.lat + (Math.random() - 0.5) * 0.05,
            longitude: city.lng + (Math.random() - 0.5) * 0.05,
            licenseNumber:
              status === DoctorApprovalStatus.DRAFT
                ? undefined
                : `PCV-${specialty.slice(0, 3).toUpperCase()}-${String(doctorIndex).padStart(4, '0')}`,
            bookingMode,
            isOnline,
            responseTimeMins: isApproved ? randInt(5, 40) : undefined,
            nextAvailableAt: isOnline ? daysFromNow(0, randInt(9, 17), 0) : undefined,
            consultationModes: isApproved
              ? pickN(['Video', 'Chat', 'In-clinic'], randInt(1, 3))
              : [],
            onlineConsultation: isApproved && doctorIndex % 2 === 0,
            onboardingStatus: status,
            submittedAt:
              status === DoctorApprovalStatus.SUBMITTED ||
              status === DoctorApprovalStatus.REJECTED
                ? daysFromNow(-randInt(1, 30))
                : undefined,
            approvedAt:
              status === DoctorApprovalStatus.APPROVED
                ? daysFromNow(-randInt(60, 400))
                : undefined,
            adminNotes:
              status === DoctorApprovalStatus.REJECTED
                ? 'License verification failed — documents did not match registry.'
                : undefined,
            availabilities:
              availabilities.length > 0
                ? { create: availabilities }
                : undefined,
            documents:
              isApproved && doctorIndex % 4 === 0
                ? {
                    create: [
                      {
                        title: 'Veterinary License',
                        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
                      },
                      {
                        title: 'Degree Certificate',
                        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
                      },
                    ],
                  }
                : undefined,
          },
        },
      },
      include: { doctorProfile: { include: { availabilities: true } } },
    });

    doctors.push({
      userId: user.id,
      profileId: user.doctorProfile!.id,
      userFullName: user.fullName,
      doctorUserId: user.id,
      specialization: specialty,
      priceCents,
      bookingMode,
      isOnline,
      onboardingStatus: status,
      availabilities: user.doctorProfile!.availabilities.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        slotMins: a.slotMins,
      })),
    });

    if (doctorIndex % 25 === 0) {
      console.log(`   … ${doctorIndex} vets created`);
    }
  }
  console.log(`✅ ${doctors.length} veterinarians\n`);

  const approvedDoctors = doctors.filter(
    (d) => d.onboardingStatus === DoctorApprovalStatus.APPROVED,
  );

  // ── Patients ────────────────────────────────────────────────────────────
  console.log('🐕 Creating pet parents (patients)...');
  const patients: PatientRecord[] = [];

  for (let i = 1; i <= COUNTS.patients; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const fullName = `${first} ${last}`;
    const city = pick(CITIES);

    const user = await prisma.user.create({
      data: {
        email: i === 1 ? 'demo.patient@pawcare.demo' : emailFor('parent', i),
        passwordHash,
        fullName,
        role: Role.PATIENT,
        phoneNumber: phoneFor(phoneCounter++),
        gender: i % 2 === 0 ? 'Female' : 'Male',
        patientProfile: {
          create: {
            gender: i % 2 === 0 ? 'Female' : 'Male',
            address: `${randInt(1, 250)} Pet Parent Street, ${city.name}, India`,
            dateOfBirth: daysFromNow(-randInt(18 * 365, 55 * 365)),
          },
        },
      },
      include: { patientProfile: true },
    });

    patients.push({
      userId: user.id,
      profileId: user.patientProfile!.id,
      fullName: user.fullName,
      email: user.email!,
      phone: user.phoneNumber!,
    });

    if (i % 50 === 0) console.log(`   … ${i} patients created`);
  }
  console.log(`✅ ${patients.length} patients\n`);

  // ── Appointments ────────────────────────────────────────────────────────
  console.log('📅 Creating appointments...');
  const usedSlotKeys = new Set<string>();
  const appointments: Array<{
    id: string;
    doctorId: string;
    doctorUserId: string;
    patientId: string | null;
    patientUserId: string | null;
    patientName: string;
    patientPhone: string;
    patientEmail: string | null;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    paymentStatus: PaymentStatus;
    priceCents: number;
    isInstant: boolean;
    reason: string;
  }> = [];

  const statusWeights: AppointmentStatus[] = [
    ...Array(150).fill(AppointmentStatus.COMPLETED),
    ...Array(90).fill(AppointmentStatus.CONFIRMED),
    ...Array(60).fill(AppointmentStatus.REQUESTED),
    ...Array(50).fill(AppointmentStatus.CANCELLED),
  ] as AppointmentStatus[];

  for (let i = 0; i < COUNTS.appointments; i++) {
    const doctor = pick(approvedDoctors);
    const status = statusWeights[i % statusWeights.length];
    const isGuest = i % 7 === 0;
    const patient = isGuest ? null : pick(patients);

    let dayOffset: number;
    if (status === AppointmentStatus.COMPLETED) dayOffset = -randInt(3, 120);
    else if (status === AppointmentStatus.CANCELLED) dayOffset = randInt(-30, 14);
    else dayOffset = randInt(1, 21);

    const slot = pickSlot(doctor, dayOffset, usedSlotKeys);
    if (!slot) continue;

    const isInstant =
      doctor.bookingMode === BookingMode.INSTANT && status !== AppointmentStatus.REQUESTED && i % 4 === 0;

    let paymentStatus: PaymentStatus;
    if (status === AppointmentStatus.COMPLETED) paymentStatus = PaymentStatus.SUCCEEDED;
    else if (status === AppointmentStatus.CANCELLED) paymentStatus = pick([PaymentStatus.CANCELLED, PaymentStatus.FAILED, PaymentStatus.PENDING]);
    else if (status === AppointmentStatus.REQUESTED) paymentStatus = PaymentStatus.PENDING;
    else paymentStatus = pick([PaymentStatus.SUCCEEDED, PaymentStatus.PENDING]);

    const apt = await prisma.appointment.create({
      data: {
        doctorId: doctor.profileId,
        patientId: patient?.profileId,
        patientName: patient?.fullName ?? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        patientPhone: patient?.phone ?? phoneFor(phoneCounter++),
        patientEmail: patient?.email ?? (i % 3 === 0 ? `guest${i}@pawcare.demo` : undefined),
        startAt: slot.startAt,
        endAt: slot.endAt,
        status,
        isInstant,
        reason: pick(VISIT_REASONS),
        paymentStatus,
      },
    });

    appointments.push({
      id: apt.id,
      doctorId: doctor.profileId,
      doctorUserId: doctor.userId,
      patientId: patient?.profileId ?? null,
      patientUserId: patient?.userId ?? null,
      patientName: apt.patientName,
      patientPhone: apt.patientPhone,
      patientEmail: apt.patientEmail,
      startAt: apt.startAt,
      endAt: apt.endAt,
      status: apt.status,
      paymentStatus: apt.paymentStatus,
      priceCents: doctor.priceCents,
      isInstant: apt.isInstant,
      reason: apt.reason ?? '',
    });

    if ((i + 1) % 100 === 0) console.log(`   … ${i + 1} appointments`);
  }
  console.log(`✅ ${appointments.length} appointments\n`);

  // ── Payments ────────────────────────────────────────────────────────────
  console.log('💳 Creating payments...');
  let paymentCount = 0;
  for (const apt of appointments) {
    if (apt.paymentStatus === PaymentStatus.PENDING && apt.status === AppointmentStatus.REQUESTED) {
      if (Math.random() > 0.6) continue;
    }
    await prisma.payment.create({
      data: {
        appointmentId: apt.id,
        stripeSessionId: `cs_demo_${apt.id.slice(-12)}`,
        amount: apt.priceCents || randInt(40, 200) * 1000,
        currency: 'INR',
        status: apt.paymentStatus,
        failureReason:
          apt.paymentStatus === PaymentStatus.FAILED ? 'Card declined by issuer' : undefined,
        idempotencyKey: `idem_${apt.id}`,
      },
    });
    paymentCount++;
  }
  console.log(`✅ ${paymentCount} payments\n`);

  // ── Reviews ─────────────────────────────────────────────────────────────
  console.log('⭐ Creating reviews...');
  const completedWithPatient = appointments.filter(
    (a) => a.status === AppointmentStatus.COMPLETED && a.patientUserId,
  );
  const reviewTargets = pickN(completedWithPatient, Math.min(COUNTS.reviews, completedWithPatient.length));
  let reviewCount = 0;
  for (const apt of reviewTargets) {
    await prisma.review.create({
      data: {
        appointmentId: apt.id,
        authorId: apt.patientUserId!,
        doctorUserId: apt.doctorUserId,
        rating: randInt(3, 5),
        comment: pick(REVIEW_COMMENTS),
        createdAt: addMins(apt.endAt, randInt(30, 1440)),
      },
    });
    reviewCount++;
  }
  console.log(`✅ ${reviewCount} reviews\n`);

  // ── Conversations & messages ────────────────────────────────────────────
  console.log('💬 Creating chat conversations...');
  const chatAppointments = pickN(
    appointments.filter((a) => a.status !== AppointmentStatus.CANCELLED),
    Math.min(COUNTS.conversations, appointments.length),
  );
  let messageCount = 0;
  for (const apt of chatAppointments) {
    const conv = await prisma.conversation.create({
      data: { appointmentId: apt.id },
    });
    const patientSender = apt.patientUserId ?? apt.doctorUserId;
    const snippets = [
      `Hi, I'm bringing my pet for: ${apt.reason}`,
      'Thanks for sharing. Can you tell me how long symptoms have lasted?',
      'About 3 days now. Energy levels are lower than usual.',
      'Please keep them hydrated. I\'ll review everything during the consult.',
      'Got it, thank you doctor!',
    ];
    for (let m = 0; m < COUNTS.messagesPerConversation; m++) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: m % 2 === 0 ? patientSender : apt.doctorUserId,
          type: MessageType.TEXT,
          body: snippets[m % snippets.length],
          isRead: m < COUNTS.messagesPerConversation - 1,
          createdAt: addMins(apt.startAt, -60 + m * 10),
        },
      });
      messageCount++;
    }
  }
  console.log(`✅ ${chatAppointments.length} conversations, ${messageCount} messages\n`);

  // ── Call sessions ───────────────────────────────────────────────────────
  console.log('📞 Creating video call sessions...');
  const callTargets = pickN(
    appointments.filter((a) => a.status === AppointmentStatus.COMPLETED),
    Math.min(COUNTS.callSessions, appointments.length),
  );
  for (const apt of callTargets) {
    await prisma.callSession.create({
      data: {
        appointmentId: apt.id,
        type: CallType.VIDEO,
        startedAt: apt.startAt,
        endedAt: apt.endAt,
      },
    });
  }
  console.log(`✅ ${callTargets.length} call sessions\n`);

  // ── Email logs ──────────────────────────────────────────────────────────
  console.log('📧 Creating email logs...');
  const templates = [
    'signup-confirmation',
    'appointment-created',
    'appointment-confirmed',
    'appointment-cancelled',
    'payment-success',
    'payment-failed',
    'otp-login',
  ];
  for (let i = 0; i < COUNTS.emailLogs; i++) {
    const apt = pick(appointments);
    await prisma.emailLog.create({
      data: {
        to: apt.patientEmail ?? emailFor('parent', randInt(1, COUNTS.patients)),
        template: pick(templates),
        subject: 'PawCare notification',
        status: pick([EmailStatus.SENT, EmailStatus.SENT, EmailStatus.PENDING, EmailStatus.FAILED]),
        attemptCount: randInt(0, 3),
        lastAttemptAt: daysFromNow(-randInt(0, 14)),
        appointmentId: apt.id,
        failureReason: Math.random() > 0.85 ? 'SMTP timeout' : undefined,
      },
    });
  }
  console.log(`✅ ${COUNTS.emailLogs} email logs\n`);

  // ── Blog posts ──────────────────────────────────────────────────────────
  console.log('📝 Creating blog posts...');
  for (let i = 0; i < BLOG_TOPICS.length; i++) {
    const topic = BLOG_TOPICS[i];
    await prisma.blog.create({
      data: {
        title: topic.title,
        slug: slugify(topic.title),
        excerpt: topic.excerpt,
        content: `<p>${topic.excerpt}</p><p>PawCare connects pet parents with trusted veterinarians across India. Book instant or scheduled consults, chat with your vet, and keep your pet's health records in one place.</p><h2>Key takeaways</h2><ul><li>Consult a licensed veterinarian for persistent symptoms</li><li>Preventive care saves cost and stress long-term</li><li>Use PawCare for video, chat, and in-clinic bookings</li></ul>`,
        category: topic.category,
        author: 'PawCare Editorial',
        readMins: randInt(4, 9),
        status: BlogStatus.PUBLISHED,
        publishedAt: daysFromNow(-randInt(1, 90)),
        coverImage: `/images/${['general-practice', 'Nutrition', 'Dermatology', 'surgery'][i % 4]}.jpg`,
      },
    });
  }
  console.log(`✅ ${BLOG_TOPICS.length} blog posts\n`);

  // ── OTP samples ─────────────────────────────────────────────────────────
  console.log('🔐 Creating OTP samples...');
  await prisma.otpVerification.createMany({
    data: [
      {
        target: 'demo.patient@pawcare.demo',
        code: '000000',
        type: OtpType.EMAIL,
        status: OtpStatus.PENDING,
        expiresAt: addMins(new Date(), 10),
      },
      {
        target: phoneFor(700),
        code: '000000',
        type: OtpType.PHONE,
        status: OtpStatus.PENDING,
        expiresAt: addMins(new Date(), 10),
      },
      {
        target: 'guest@pawcare.demo',
        code: '000000',
        type: OtpType.EMAIL,
        status: OtpStatus.VERIFIED,
        expiresAt: addMins(new Date(), 10),
      },
    ],
  });
  console.log(`✅ OTP samples (use 000000 for booking)\n`);

  // ── Summary ─────────────────────────────────────────────────────────────
  const specialtyCounts = approvedDoctors.reduce<Record<string, number>>((acc, d) => {
    acc[d.specialization] = (acc[d.specialization] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\n' + '═'.repeat(72));
  console.log('🎉 PAWCARE DEMO SEED COMPLETE');
  console.log('═'.repeat(72));
  console.log(`\n🔑 Password for all accounts: ${PASSWORD}\n`);
  console.log('👤 Admin logins:');
  console.log('   • admin@pawcare.demo');
  console.log('   • ops@pawcare.demo\n');
  console.log('🩺 Demo vet:     demo.vet@pawcare.demo');
  console.log('🐕 Demo patient:  demo.patient@pawcare.demo\n');
  console.log('📊 Records created:');
  console.log(`   • ${doctors.length} veterinarians (${approvedDoctors.length} approved)`);
  console.log(`   • ${patients.length} pet parents`);
  console.log(`   • ${appointments.length} appointments`);
  console.log(`   • ${reviewCount} reviews`);
  console.log(`   • ${chatAppointments.length} conversations`);
  console.log(`   • ${paymentCount} payments`);
  console.log(`   • ${BLOG_TOPICS.length} blog posts`);
  console.log(`   • ${approvedDoctors.filter((d) => d.isOnline).length} vets online now (instant)\n`);
  console.log('🏷️  Approved vets by specialty:');
  for (const [spec, count] of Object.entries(specialtyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   • ${spec}: ${count}`);
  }
  console.log('\n' + '═'.repeat(72) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
