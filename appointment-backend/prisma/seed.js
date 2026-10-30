"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
// ─── Scale targets (demo / client showcase) ───────────────────────────────
var COUNTS = {
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
var PASSWORD = 'password123';
var PET_SPECIALTIES = [
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
];
var CITIES = [
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
var CLINIC_PREFIXES = [
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
var PET_SPECIES = ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Reptiles', 'Small mammals'];
var SUB_SPECIALTIES = [
    'Puppy & kitten care',
    'Senior pet wellness',
    'Vaccination programs',
    'Post-surgery recovery',
    'Weight management',
    'Anxiety & stress',
    'Dental hygiene',
    'Chronic disease management',
];
var VISIT_REASONS = [
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
var REVIEW_COMMENTS = [
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
var FIRST_NAMES = [
    'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karan', 'Dev', 'Nikhil',
    'Priya', 'Ananya', 'Meera', 'Riya', 'Sneha', 'Kavya', 'Isha', 'Neha',
    'Rajesh', 'Suresh', 'Amit', 'Vikram', 'Sanjay', 'Rahul', 'Manish', 'Deepak',
    'Lakshmi', 'Pooja', 'Shreya', 'Divya', 'Nandini', 'Swati',
];
var LAST_NAMES = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Gupta',
    'Mehta', 'Joshi', 'Kapoor', 'Malhotra', 'Chopra', 'Bansal', 'Agarwal', 'Verma',
    'Das', 'Roy', 'Pillai', 'Menon', 'Kulkarni', 'Desai', 'Bhatt', 'Saxena',
];
var UNIVERSITIES = [
    'Mumbai Veterinary College',
    'IVRI Bareilly',
    'MAFSU Nagpur',
    'WBUAFS Kolkata',
    'KVAFSU Bidar',
    'TANUVAS Chennai',
    'LUVAS Hisar',
];
var BLOG_TOPICS = [
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
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
    var copy = __spreadArray([], arr, true);
    var out = [];
    for (var i = 0; i < n && copy.length > 0; i++) {
        var idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function parseHHmm(time) {
    var _a = time.split(':').map(Number), h = _a[0], m = _a[1];
    return h * 60 + m;
}
function phoneFor(index) {
    return "91".concat(String(7000000000 + index).slice(-10));
}
function emailFor(role, index) {
    return "".concat(role, ".").concat(index, "@pawcare.demo");
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
function addMins(d, mins) {
    return new Date(d.getTime() + mins * 60000);
}
function daysFromNow(days, hour, minute) {
    if (hour === void 0) { hour = 10; }
    if (minute === void 0) { minute = 0; }
    var d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
}
function alignToWeekday(date, dayOfWeek) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() + 1);
    }
    return d;
}
function buildAvailability(specialty) {
    var slotMins = specialty === 'Emergency Care' ? 20 : specialty === 'Surgery' ? 45 : 30;
    var patterns = [
        [
            { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotMins: slotMins },
            { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotMins: slotMins },
            { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', slotMins: slotMins },
        ],
        [
            { dayOfWeek: 2, startTime: '10:00', endTime: '14:00', slotMins: slotMins },
            { dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotMins: slotMins },
        ],
        [
            { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotMins: slotMins },
            { dayOfWeek: 2, startTime: '08:00', endTime: '12:00', slotMins: slotMins },
            { dayOfWeek: 4, startTime: '15:00', endTime: '19:00', slotMins: slotMins },
        ],
        [
            { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', slotMins: slotMins },
            { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotMins: slotMins },
        ],
    ];
    return pick(patterns);
}
function priceForSpecialty(specialty) {
    var _a;
    var map = {
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
    var base = (_a = map[specialty]) !== null && _a !== void 0 ? _a : 69900;
    return base + randInt(-5, 15) * 1000;
}
function pickSlot(doctor, dayOffset, usedKeys) {
    if (doctor.availabilities.length === 0)
        return null;
    for (var attempt = 0; attempt < 40; attempt++) {
        var avail = pick(doctor.availabilities);
        var base = alignToWeekday(daysFromNow(dayOffset), avail.dayOfWeek);
        var startMins = parseHHmm(avail.startTime);
        var endMins = parseHHmm(avail.endTime);
        var slots = [];
        for (var m = startMins; m + avail.slotMins <= endMins; m += avail.slotMins) {
            slots.push(m);
        }
        if (slots.length === 0)
            continue;
        var slotStartMins = pick(slots);
        var startAt = addMins(base, slotStartMins);
        var endAt = addMins(startAt, avail.slotMins);
        var key = "".concat(doctor.profileId, ":").concat(startAt.toISOString());
        if (usedKeys.has(key))
            continue;
        usedKeys.add(key);
        return { startAt: startAt, endAt: endAt };
    }
    return null;
}
// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var passwordHash, phoneCounter, doctors, statusPlan, doctorIndex, _i, statusPlan_1, status_1, specialty, city, first, last, fullName, isApproved, bookingMode, isOnline, availabilities, priceCents, years, user, approvedDoctors, patients, i, first, last, fullName, city, user, usedSlotKeys, appointments, statusWeights, i, doctor, status_2, isGuest, patient, dayOffset, slot, isInstant, paymentStatus, apt, paymentCount, _a, appointments_1, apt, completedWithPatient, reviewTargets, reviewCount, _b, reviewTargets_1, apt, chatAppointments, messageCount, _c, chatAppointments_1, apt, conv, patientSender, snippets, m, callTargets, _d, callTargets_1, apt, templates, i, apt, i, topic, specialtyCounts, _e, _f, _g, spec, count;
        var _h, _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    console.log('🐾 PawCare — seeding demo database...\n');
                    console.log('🗑️  Clearing existing data...');
                    return [4 /*yield*/, prisma.emailLog.deleteMany()];
                case 1:
                    _r.sent();
                    return [4 /*yield*/, prisma.payment.deleteMany()];
                case 2:
                    _r.sent();
                    return [4 /*yield*/, prisma.review.deleteMany()];
                case 3:
                    _r.sent();
                    return [4 /*yield*/, prisma.callSession.deleteMany()];
                case 4:
                    _r.sent();
                    return [4 /*yield*/, prisma.message.deleteMany()];
                case 5:
                    _r.sent();
                    return [4 /*yield*/, prisma.conversation.deleteMany()];
                case 6:
                    _r.sent();
                    return [4 /*yield*/, prisma.appointment.deleteMany()];
                case 7:
                    _r.sent();
                    return [4 /*yield*/, prisma.doctorDocument.deleteMany()];
                case 8:
                    _r.sent();
                    return [4 /*yield*/, prisma.availability.deleteMany()];
                case 9:
                    _r.sent();
                    return [4 /*yield*/, prisma.blog.deleteMany()];
                case 10:
                    _r.sent();
                    return [4 /*yield*/, prisma.staticPage.deleteMany()];
                case 11:
                    _r.sent();
                    return [4 /*yield*/, prisma.doctorProfile.deleteMany()];
                case 12:
                    _r.sent();
                    return [4 /*yield*/, prisma.patientProfile.deleteMany()];
                case 13:
                    _r.sent();
                    return [4 /*yield*/, prisma.otpVerification.deleteMany()];
                case 14:
                    _r.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 15:
                    _r.sent();
                    console.log('✅ Database cleared\n');
                    return [4 /*yield*/, bcrypt.hash(PASSWORD, 10)];
                case 16:
                    passwordHash = _r.sent();
                    phoneCounter = 1;
                    // ── Admins ──────────────────────────────────────────────────────────────
                    console.log('👤 Creating admins...');
                    return [4 /*yield*/, prisma.user.createMany({
                            data: [
                                {
                                    email: 'admin@pawcare.demo',
                                    passwordHash: passwordHash,
                                    fullName: 'PawCare Super Admin',
                                    role: client_1.Role.ADMIN,
                                    phoneNumber: phoneFor(phoneCounter++),
                                    gender: 'Prefer not to say',
                                },
                                {
                                    email: 'ops@pawcare.demo',
                                    passwordHash: passwordHash,
                                    fullName: 'Operations Manager',
                                    role: client_1.Role.ADMIN,
                                    phoneNumber: phoneFor(phoneCounter++),
                                    gender: 'Female',
                                },
                            ],
                        })];
                case 17:
                    _r.sent();
                    console.log("\u2705 ".concat(COUNTS.admins, " admins\n"));
                    // ── Doctors ─────────────────────────────────────────────────────────────
                    console.log('🩺 Creating veterinarians...');
                    doctors = [];
                    statusPlan = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], Array(COUNTS.doctorsApproved).fill(client_1.DoctorApprovalStatus.APPROVED), true), Array(COUNTS.doctorsSubmitted).fill(client_1.DoctorApprovalStatus.SUBMITTED), true), Array(COUNTS.doctorsDraft).fill(client_1.DoctorApprovalStatus.DRAFT), true), Array(COUNTS.doctorsRejected).fill(client_1.DoctorApprovalStatus.REJECTED), true);
                    doctorIndex = 0;
                    _i = 0, statusPlan_1 = statusPlan;
                    _r.label = 18;
                case 18:
                    if (!(_i < statusPlan_1.length)) return [3 /*break*/, 21];
                    status_1 = statusPlan_1[_i];
                    doctorIndex++;
                    specialty = PET_SPECIALTIES[doctorIndex % PET_SPECIALTIES.length];
                    city = CITIES[doctorIndex % CITIES.length];
                    first = pick(FIRST_NAMES);
                    last = pick(LAST_NAMES);
                    fullName = "Dr. ".concat(first, " ").concat(last);
                    isApproved = status_1 === client_1.DoctorApprovalStatus.APPROVED;
                    bookingMode = isApproved && doctorIndex % 3 !== 0
                        ? client_1.BookingMode.INSTANT
                        : client_1.BookingMode.APPROVAL_REQUIRED;
                    isOnline = isApproved && bookingMode === client_1.BookingMode.INSTANT && doctorIndex % 5 === 0;
                    availabilities = isApproved ? buildAvailability(specialty) : [];
                    priceCents = isApproved ? priceForSpecialty(specialty) : 0;
                    years = isApproved ? randInt(3, 22) : randInt(1, 4);
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: doctorIndex === 1 ? 'demo.vet@pawcare.demo' : emailFor('vet', doctorIndex),
                                passwordHash: passwordHash,
                                fullName: fullName,
                                role: client_1.Role.DOCTOR,
                                phoneNumber: phoneFor(phoneCounter++),
                                gender: doctorIndex % 2 === 0 ? 'Female' : 'Male',
                                doctorProfile: {
                                    create: {
                                        bio: "".concat(specialty, " veterinarian serving ").concat(city.name, " \u2014 ").concat(years, "+ years caring for dogs, cats, and companion animals."),
                                        specialization: specialty,
                                        subSpecialties: pickN(SUB_SPECIALTIES, randInt(2, 4)),
                                        conditions: pickN(PET_SPECIES, randInt(2, 4)),
                                        degree: pick(['BVSc', 'MVSc', 'BVSc & AH']),
                                        university: pick(UNIVERSITIES),
                                        graduationYear: 2026 - years - randInt(22, 28),
                                        priceCents: priceCents,
                                        currency: 'INR',
                                        yearsOfExperience: years,
                                        clinicName: "".concat(pick(CLINIC_PREFIXES), " ").concat(city.name),
                                        clinicAddress: "".concat(randInt(1, 199), " Pet Care Lane, ").concat(city.name),
                                        city: city.name,
                                        country: 'India',
                                        latitude: city.lat + (Math.random() - 0.5) * 0.05,
                                        longitude: city.lng + (Math.random() - 0.5) * 0.05,
                                        licenseNumber: status_1 === client_1.DoctorApprovalStatus.DRAFT
                                            ? undefined
                                            : "PCV-".concat(specialty.slice(0, 3).toUpperCase(), "-").concat(String(doctorIndex).padStart(4, '0')),
                                        bookingMode: bookingMode,
                                        isOnline: isOnline,
                                        responseTimeMins: isApproved ? randInt(5, 40) : undefined,
                                        nextAvailableAt: isOnline ? daysFromNow(0, randInt(9, 17), 0) : undefined,
                                        consultationModes: isApproved
                                            ? pickN(['Video', 'Chat', 'In-clinic'], randInt(1, 3))
                                            : [],
                                        onlineConsultation: isApproved && doctorIndex % 2 === 0,
                                        onboardingStatus: status_1,
                                        submittedAt: status_1 === client_1.DoctorApprovalStatus.SUBMITTED ||
                                            status_1 === client_1.DoctorApprovalStatus.REJECTED
                                            ? daysFromNow(-randInt(1, 30))
                                            : undefined,
                                        approvedAt: status_1 === client_1.DoctorApprovalStatus.APPROVED
                                            ? daysFromNow(-randInt(60, 400))
                                            : undefined,
                                        adminNotes: status_1 === client_1.DoctorApprovalStatus.REJECTED
                                            ? 'License verification failed — documents did not match registry.'
                                            : undefined,
                                        availabilities: availabilities.length > 0
                                            ? { create: availabilities }
                                            : undefined,
                                        documents: isApproved && doctorIndex % 4 === 0
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
                        })];
                case 19:
                    user = _r.sent();
                    doctors.push({
                        userId: user.id,
                        profileId: user.doctorProfile.id,
                        userFullName: user.fullName,
                        doctorUserId: user.id,
                        specialization: specialty,
                        priceCents: priceCents,
                        bookingMode: bookingMode,
                        isOnline: isOnline,
                        onboardingStatus: status_1,
                        availabilities: user.doctorProfile.availabilities.map(function (a) { return ({
                            dayOfWeek: a.dayOfWeek,
                            startTime: a.startTime,
                            endTime: a.endTime,
                            slotMins: a.slotMins,
                        }); }),
                    });
                    if (doctorIndex % 25 === 0) {
                        console.log("   \u2026 ".concat(doctorIndex, " vets created"));
                    }
                    _r.label = 20;
                case 20:
                    _i++;
                    return [3 /*break*/, 18];
                case 21:
                    console.log("\u2705 ".concat(doctors.length, " veterinarians\n"));
                    approvedDoctors = doctors.filter(function (d) { return d.onboardingStatus === client_1.DoctorApprovalStatus.APPROVED; });
                    // ── Patients ────────────────────────────────────────────────────────────
                    console.log('🐕 Creating pet parents (patients)...');
                    patients = [];
                    i = 1;
                    _r.label = 22;
                case 22:
                    if (!(i <= COUNTS.patients)) return [3 /*break*/, 25];
                    first = pick(FIRST_NAMES);
                    last = pick(LAST_NAMES);
                    fullName = "".concat(first, " ").concat(last);
                    city = pick(CITIES);
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: i === 1 ? 'demo.patient@pawcare.demo' : emailFor('parent', i),
                                passwordHash: passwordHash,
                                fullName: fullName,
                                role: client_1.Role.PATIENT,
                                phoneNumber: phoneFor(phoneCounter++),
                                gender: i % 2 === 0 ? 'Female' : 'Male',
                                patientProfile: {
                                    create: {
                                        gender: i % 2 === 0 ? 'Female' : 'Male',
                                        address: "".concat(randInt(1, 250), " Pet Parent Street, ").concat(city.name, ", India"),
                                        dateOfBirth: daysFromNow(-randInt(18 * 365, 55 * 365)),
                                    },
                                },
                            },
                            include: { patientProfile: true },
                        })];
                case 23:
                    user = _r.sent();
                    patients.push({
                        userId: user.id,
                        profileId: user.patientProfile.id,
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phoneNumber,
                    });
                    if (i % 50 === 0)
                        console.log("   \u2026 ".concat(i, " patients created"));
                    _r.label = 24;
                case 24:
                    i++;
                    return [3 /*break*/, 22];
                case 25:
                    console.log("\u2705 ".concat(patients.length, " patients\n"));
                    // ── Appointments ────────────────────────────────────────────────────────
                    console.log('📅 Creating appointments...');
                    usedSlotKeys = new Set();
                    appointments = [];
                    statusWeights = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], Array(150).fill(client_1.AppointmentStatus.COMPLETED), true), Array(90).fill(client_1.AppointmentStatus.CONFIRMED), true), Array(60).fill(client_1.AppointmentStatus.REQUESTED), true), Array(50).fill(client_1.AppointmentStatus.CANCELLED), true);
                    i = 0;
                    _r.label = 26;
                case 26:
                    if (!(i < COUNTS.appointments)) return [3 /*break*/, 29];
                    doctor = pick(approvedDoctors);
                    status_2 = statusWeights[i % statusWeights.length];
                    isGuest = i % 7 === 0;
                    patient = isGuest ? null : pick(patients);
                    dayOffset = void 0;
                    if (status_2 === client_1.AppointmentStatus.COMPLETED)
                        dayOffset = -randInt(3, 120);
                    else if (status_2 === client_1.AppointmentStatus.CANCELLED)
                        dayOffset = randInt(-30, 14);
                    else
                        dayOffset = randInt(1, 21);
                    slot = pickSlot(doctor, dayOffset, usedSlotKeys);
                    if (!slot)
                        return [3 /*break*/, 28];
                    isInstant = doctor.bookingMode === client_1.BookingMode.INSTANT && status_2 !== client_1.AppointmentStatus.REQUESTED && i % 4 === 0;
                    paymentStatus = void 0;
                    if (status_2 === client_1.AppointmentStatus.COMPLETED)
                        paymentStatus = client_1.PaymentStatus.SUCCEEDED;
                    else if (status_2 === client_1.AppointmentStatus.CANCELLED)
                        paymentStatus = pick([client_1.PaymentStatus.CANCELLED, client_1.PaymentStatus.FAILED, client_1.PaymentStatus.PENDING]);
                    else if (status_2 === client_1.AppointmentStatus.REQUESTED)
                        paymentStatus = client_1.PaymentStatus.PENDING;
                    else
                        paymentStatus = pick([client_1.PaymentStatus.SUCCEEDED, client_1.PaymentStatus.PENDING]);
                    return [4 /*yield*/, prisma.appointment.create({
                            data: {
                                doctorId: doctor.profileId,
                                patientId: patient === null || patient === void 0 ? void 0 : patient.profileId,
                                patientName: (_h = patient === null || patient === void 0 ? void 0 : patient.fullName) !== null && _h !== void 0 ? _h : "".concat(pick(FIRST_NAMES), " ").concat(pick(LAST_NAMES)),
                                patientPhone: (_j = patient === null || patient === void 0 ? void 0 : patient.phone) !== null && _j !== void 0 ? _j : phoneFor(phoneCounter++),
                                patientEmail: (_k = patient === null || patient === void 0 ? void 0 : patient.email) !== null && _k !== void 0 ? _k : (i % 3 === 0 ? "guest".concat(i, "@pawcare.demo") : undefined),
                                startAt: slot.startAt,
                                endAt: slot.endAt,
                                status: status_2,
                                isInstant: isInstant,
                                reason: pick(VISIT_REASONS),
                                paymentStatus: paymentStatus,
                            },
                        })];
                case 27:
                    apt = _r.sent();
                    appointments.push({
                        id: apt.id,
                        doctorId: doctor.profileId,
                        doctorUserId: doctor.userId,
                        patientId: (_l = patient === null || patient === void 0 ? void 0 : patient.profileId) !== null && _l !== void 0 ? _l : null,
                        patientUserId: (_m = patient === null || patient === void 0 ? void 0 : patient.userId) !== null && _m !== void 0 ? _m : null,
                        patientName: apt.patientName,
                        patientPhone: apt.patientPhone,
                        patientEmail: apt.patientEmail,
                        startAt: apt.startAt,
                        endAt: apt.endAt,
                        status: apt.status,
                        paymentStatus: apt.paymentStatus,
                        priceCents: doctor.priceCents,
                        isInstant: apt.isInstant,
                        reason: (_o = apt.reason) !== null && _o !== void 0 ? _o : '',
                    });
                    if ((i + 1) % 100 === 0)
                        console.log("   \u2026 ".concat(i + 1, " appointments"));
                    _r.label = 28;
                case 28:
                    i++;
                    return [3 /*break*/, 26];
                case 29:
                    console.log("\u2705 ".concat(appointments.length, " appointments\n"));
                    // ── Payments ────────────────────────────────────────────────────────────
                    console.log('💳 Creating payments...');
                    paymentCount = 0;
                    _a = 0, appointments_1 = appointments;
                    _r.label = 30;
                case 30:
                    if (!(_a < appointments_1.length)) return [3 /*break*/, 33];
                    apt = appointments_1[_a];
                    if (apt.paymentStatus === client_1.PaymentStatus.PENDING && apt.status === client_1.AppointmentStatus.REQUESTED) {
                        if (Math.random() > 0.6)
                            return [3 /*break*/, 32];
                    }
                    return [4 /*yield*/, prisma.payment.create({
                            data: {
                                appointmentId: apt.id,
                                stripeSessionId: "cs_demo_".concat(apt.id.slice(-12)),
                                amount: apt.priceCents || randInt(40, 200) * 1000,
                                currency: 'INR',
                                status: apt.paymentStatus,
                                failureReason: apt.paymentStatus === client_1.PaymentStatus.FAILED ? 'Card declined by issuer' : undefined,
                                idempotencyKey: "idem_".concat(apt.id),
                            },
                        })];
                case 31:
                    _r.sent();
                    paymentCount++;
                    _r.label = 32;
                case 32:
                    _a++;
                    return [3 /*break*/, 30];
                case 33:
                    console.log("\u2705 ".concat(paymentCount, " payments\n"));
                    // ── Reviews ─────────────────────────────────────────────────────────────
                    console.log('⭐ Creating reviews...');
                    completedWithPatient = appointments.filter(function (a) { return a.status === client_1.AppointmentStatus.COMPLETED && a.patientUserId; });
                    reviewTargets = pickN(completedWithPatient, Math.min(COUNTS.reviews, completedWithPatient.length));
                    reviewCount = 0;
                    _b = 0, reviewTargets_1 = reviewTargets;
                    _r.label = 34;
                case 34:
                    if (!(_b < reviewTargets_1.length)) return [3 /*break*/, 37];
                    apt = reviewTargets_1[_b];
                    return [4 /*yield*/, prisma.review.create({
                            data: {
                                appointmentId: apt.id,
                                authorId: apt.patientUserId,
                                doctorUserId: apt.doctorUserId,
                                rating: randInt(3, 5),
                                comment: pick(REVIEW_COMMENTS),
                                createdAt: addMins(apt.endAt, randInt(30, 1440)),
                            },
                        })];
                case 35:
                    _r.sent();
                    reviewCount++;
                    _r.label = 36;
                case 36:
                    _b++;
                    return [3 /*break*/, 34];
                case 37:
                    console.log("\u2705 ".concat(reviewCount, " reviews\n"));
                    // ── Conversations & messages ────────────────────────────────────────────
                    console.log('💬 Creating chat conversations...');
                    chatAppointments = pickN(appointments.filter(function (a) { return a.status !== client_1.AppointmentStatus.CANCELLED; }), Math.min(COUNTS.conversations, appointments.length));
                    messageCount = 0;
                    _c = 0, chatAppointments_1 = chatAppointments;
                    _r.label = 38;
                case 38:
                    if (!(_c < chatAppointments_1.length)) return [3 /*break*/, 44];
                    apt = chatAppointments_1[_c];
                    return [4 /*yield*/, prisma.conversation.create({
                            data: { appointmentId: apt.id },
                        })];
                case 39:
                    conv = _r.sent();
                    patientSender = (_p = apt.patientUserId) !== null && _p !== void 0 ? _p : apt.doctorUserId;
                    snippets = [
                        "Hi, I'm bringing my pet for: ".concat(apt.reason),
                        'Thanks for sharing. Can you tell me how long symptoms have lasted?',
                        'About 3 days now. Energy levels are lower than usual.',
                        'Please keep them hydrated. I\'ll review everything during the consult.',
                        'Got it, thank you doctor!',
                    ];
                    m = 0;
                    _r.label = 40;
                case 40:
                    if (!(m < COUNTS.messagesPerConversation)) return [3 /*break*/, 43];
                    return [4 /*yield*/, prisma.message.create({
                            data: {
                                conversationId: conv.id,
                                senderId: m % 2 === 0 ? patientSender : apt.doctorUserId,
                                type: client_1.MessageType.TEXT,
                                body: snippets[m % snippets.length],
                                isRead: m < COUNTS.messagesPerConversation - 1,
                                createdAt: addMins(apt.startAt, -60 + m * 10),
                            },
                        })];
                case 41:
                    _r.sent();
                    messageCount++;
                    _r.label = 42;
                case 42:
                    m++;
                    return [3 /*break*/, 40];
                case 43:
                    _c++;
                    return [3 /*break*/, 38];
                case 44:
                    console.log("\u2705 ".concat(chatAppointments.length, " conversations, ").concat(messageCount, " messages\n"));
                    // ── Call sessions ───────────────────────────────────────────────────────
                    console.log('📞 Creating video call sessions...');
                    callTargets = pickN(appointments.filter(function (a) { return a.status === client_1.AppointmentStatus.COMPLETED; }), Math.min(COUNTS.callSessions, appointments.length));
                    _d = 0, callTargets_1 = callTargets;
                    _r.label = 45;
                case 45:
                    if (!(_d < callTargets_1.length)) return [3 /*break*/, 48];
                    apt = callTargets_1[_d];
                    return [4 /*yield*/, prisma.callSession.create({
                            data: {
                                appointmentId: apt.id,
                                type: client_1.CallType.VIDEO,
                                startedAt: apt.startAt,
                                endedAt: apt.endAt,
                            },
                        })];
                case 46:
                    _r.sent();
                    _r.label = 47;
                case 47:
                    _d++;
                    return [3 /*break*/, 45];
                case 48:
                    console.log("\u2705 ".concat(callTargets.length, " call sessions\n"));
                    // ── Email logs ──────────────────────────────────────────────────────────
                    console.log('📧 Creating email logs...');
                    templates = [
                        'signup-confirmation',
                        'appointment-created',
                        'appointment-confirmed',
                        'appointment-cancelled',
                        'payment-success',
                        'payment-failed',
                        'otp-login',
                    ];
                    i = 0;
                    _r.label = 49;
                case 49:
                    if (!(i < COUNTS.emailLogs)) return [3 /*break*/, 52];
                    apt = pick(appointments);
                    return [4 /*yield*/, prisma.emailLog.create({
                            data: {
                                to: (_q = apt.patientEmail) !== null && _q !== void 0 ? _q : emailFor('parent', randInt(1, COUNTS.patients)),
                                template: pick(templates),
                                subject: 'PawCare notification',
                                status: pick([client_1.EmailStatus.SENT, client_1.EmailStatus.SENT, client_1.EmailStatus.PENDING, client_1.EmailStatus.FAILED]),
                                attemptCount: randInt(0, 3),
                                lastAttemptAt: daysFromNow(-randInt(0, 14)),
                                appointmentId: apt.id,
                                failureReason: Math.random() > 0.85 ? 'SMTP timeout' : undefined,
                            },
                        })];
                case 50:
                    _r.sent();
                    _r.label = 51;
                case 51:
                    i++;
                    return [3 /*break*/, 49];
                case 52:
                    console.log("\u2705 ".concat(COUNTS.emailLogs, " email logs\n"));
                    // ── Blog posts ──────────────────────────────────────────────────────────
                    console.log('📝 Creating blog posts...');
                    i = 0;
                    _r.label = 53;
                case 53:
                    if (!(i < BLOG_TOPICS.length)) return [3 /*break*/, 56];
                    topic = BLOG_TOPICS[i];
                    return [4 /*yield*/, prisma.blog.create({
                            data: {
                                title: topic.title,
                                slug: slugify(topic.title),
                                excerpt: topic.excerpt,
                                content: "<p>".concat(topic.excerpt, "</p><p>PawCare connects pet parents with trusted veterinarians across India. Book instant or scheduled consults, chat with your vet, and keep your pet's health records in one place.</p><h2>Key takeaways</h2><ul><li>Consult a licensed veterinarian for persistent symptoms</li><li>Preventive care saves cost and stress long-term</li><li>Use PawCare for video, chat, and in-clinic bookings</li></ul>"),
                                category: topic.category,
                                author: 'PawCare Editorial',
                                readMins: randInt(4, 9),
                                status: client_1.BlogStatus.PUBLISHED,
                                publishedAt: daysFromNow(-randInt(1, 90)),
                                coverImage: "/images/".concat(['general-practice', 'Nutrition', 'Dermatology', 'surgery'][i % 4], ".jpg"),
                            },
                        })];
                case 54:
                    _r.sent();
                    _r.label = 55;
                case 55:
                    i++;
                    return [3 /*break*/, 53];
                case 56:
                    console.log("\u2705 ".concat(BLOG_TOPICS.length, " blog posts\n"));
                    // ── OTP samples ─────────────────────────────────────────────────────────
                    console.log('🔐 Creating OTP samples...');
                    return [4 /*yield*/, prisma.otpVerification.createMany({
                            data: [
                                {
                                    target: 'demo.patient@pawcare.demo',
                                    code: '000000',
                                    type: client_1.OtpType.EMAIL,
                                    status: client_1.OtpStatus.PENDING,
                                    expiresAt: addMins(new Date(), 10),
                                },
                                {
                                    target: phoneFor(700),
                                    code: '000000',
                                    type: client_1.OtpType.PHONE,
                                    status: client_1.OtpStatus.PENDING,
                                    expiresAt: addMins(new Date(), 10),
                                },
                                {
                                    target: 'guest@pawcare.demo',
                                    code: '000000',
                                    type: client_1.OtpType.EMAIL,
                                    status: client_1.OtpStatus.VERIFIED,
                                    expiresAt: addMins(new Date(), 10),
                                },
                            ],
                        })];
                case 57:
                    _r.sent();
                    console.log("\u2705 OTP samples (use 000000 for booking)\n");
                    specialtyCounts = approvedDoctors.reduce(function (acc, d) {
                        var _a;
                        acc[d.specialization] = ((_a = acc[d.specialization]) !== null && _a !== void 0 ? _a : 0) + 1;
                        return acc;
                    }, {});
                    console.log('\n' + '═'.repeat(72));
                    console.log('🎉 PAWCARE DEMO SEED COMPLETE');
                    console.log('═'.repeat(72));
                    console.log("\n\uD83D\uDD11 Password for all accounts: ".concat(PASSWORD, "\n"));
                    console.log('👤 Admin logins:');
                    console.log('   • admin@pawcare.demo');
                    console.log('   • ops@pawcare.demo\n');
                    console.log('🩺 Demo vet:     demo.vet@pawcare.demo');
                    console.log('🐕 Demo patient:  demo.patient@pawcare.demo\n');
                    console.log('📊 Records created:');
                    console.log("   \u2022 ".concat(doctors.length, " veterinarians (").concat(approvedDoctors.length, " approved)"));
                    console.log("   \u2022 ".concat(patients.length, " pet parents"));
                    console.log("   \u2022 ".concat(appointments.length, " appointments"));
                    console.log("   \u2022 ".concat(reviewCount, " reviews"));
                    console.log("   \u2022 ".concat(chatAppointments.length, " conversations"));
                    console.log("   \u2022 ".concat(paymentCount, " payments"));
                    console.log("   \u2022 ".concat(BLOG_TOPICS.length, " blog posts"));
                    console.log("   \u2022 ".concat(approvedDoctors.filter(function (d) { return d.isOnline; }).length, " vets online now (instant)\n"));
                    console.log('🏷️  Approved vets by specialty:');
                    for (_e = 0, _f = Object.entries(specialtyCounts).sort(function (a, b) { return b[1] - a[1]; }); _e < _f.length; _e++) {
                        _g = _f[_e], spec = _g[0], count = _g[1];
                        console.log("   \u2022 ".concat(spec, ": ").concat(count));
                    }
                    console.log('\n' + '═'.repeat(72) + '\n');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
