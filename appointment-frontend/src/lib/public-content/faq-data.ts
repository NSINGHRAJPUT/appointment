export type FaqItem = { question: string; answer: string };

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "booking",
    title: "Booking & Appointments",
    items: [
      {
        question: "How do I book my first vet appointment on PawCare?",
        answer:
          "Create a free account or continue as a guest, visit Find Vets, choose a veterinarian by specialty or location, pick an available slot, and confirm. You will receive a confirmation with appointment details and reminders.",
      },
      {
        question: "Can I reschedule or cancel an appointment?",
        answer:
          "Yes. Open your dashboard, go to Appointments, and reschedule or cancel up to 24 hours before the visit without a penalty. For last-minute changes, contact the clinic or our support team.",
      },
      {
        question: "What is the difference between instant consult and scheduled booking?",
        answer:
          "Instant consult connects you with a vet who is online right now — ideal for urgent but non-emergency questions. Scheduled booking lets you choose a specific date and time for a video call or in-clinic visit in advance.",
      },
      {
        question: "Can I book for multiple pets?",
        answer:
          "Yes. Add details for each pet when booking or mention additional pets in the consultation notes. Some vets may recommend separate slots for thorough exams.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & Pricing",
    items: [
      {
        question: "How much does a consultation cost?",
        answer:
          "Fees vary by veterinarian and consultation type. Each vet profile shows their price before you confirm. Some offer free introductory sessions; others charge per visit. You always see the amount before payment.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept major credit and debit cards, UPI, and net banking where available. Payment is processed securely at the time of booking unless the vet offers pay-at-clinic for in-person visits.",
      },
      {
        question: "Can I get a refund if I cancel?",
        answer:
          "Cancellations made at least 24 hours in advance are typically refunded in full. Late cancellations may be subject to the vet's cancellation policy, which is shown before you book.",
      },
    ],
  },
  {
    id: "consultations",
    title: "Online & In-Clinic Care",
    items: [
      {
        question: "When should I book an online vet consultation?",
        answer:
          "Online consults work well for follow-ups, mild symptoms, skin or coat issues, diet advice, behavior concerns, and post-surgery check-ins. For severe bleeding, breathing difficulty, collapse, or suspected poisoning, seek emergency in-clinic care immediately.",
      },
      {
        question: "How do video consultations work?",
        answer:
          "After booking, you receive a secure link to join your session at the scheduled time. You need a device with a camera and microphone. Your vet can review symptoms, provide guidance, and recommend in-clinic care if needed.",
      },
      {
        question: "Can I book an in-clinic visit through PawCare?",
        answer:
          "Yes. Many veterinarians on PawCare offer in-clinic appointments for exams, vaccinations, surgery, and diagnostics. Filter by location and choose a slot that works for you.",
      },
      {
        question: "How do I know the vet is qualified?",
        answer:
          "All veterinarians complete identity and license verification before their profile goes live. You can view specialization, experience, ratings from other pet parents, and consultation fees before booking.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Support",
    items: [
      {
        question: "Do I need an account to book?",
        answer:
          "No. Guest booking with OTP verification is available for instant and scheduled consults. Creating an account lets you manage appointments, chat with your vet, and access records in one place.",
      },
      {
        question: "How is my pet's health data protected?",
        answer:
          "We encrypt data in transit and at rest, limit access to authorized personnel, and never sell your information. Read our Privacy Policy and Data Protection page for full details.",
      },
      {
        question: "How do I contact PawCare support?",
        answer:
          "Visit our Contact page, email support@pawcare.com, or use in-app chat. For life-threatening pet emergencies, go to the nearest emergency veterinary clinic — PawCare is not an emergency hotline.",
      },
    ],
  },
];

export const ALL_FAQ_ITEMS: FaqItem[] = FAQ_SECTIONS.flatMap((section) => section.items);
