"use client";

import { useState } from "react";
import { Calendar, CreditCardIcon, Search } from "lucide-react";
import Link from "next/link";

type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionSectionProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  items: AccordionItem[];
};

function AccordionSection({ id, icon, title, items }: AccordionSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="scroll-mt-32" id={id}>
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant">
        <span className="text-primary text-3xl">{icon}</span>
        <h2 className="font-h2 text-h2 text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`bg-surface-container-lowest border rounded-xl overflow-hidden shadow-sm transition-colors ${
                isOpen
                  ? "border-primary/40"
                  : "border-outline-variant hover:border-primary/30"
              }`}
            >
              <button
                className={`w-full px-6 py-5 flex items-center justify-between focus:outline-none focus:bg-surface-container-low transition-colors text-left ${
                  isOpen ? "bg-surface-container-low" : "bg-white"
                }`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="font-h3 text-h3 text-on-surface pr-4">
                  {item.question}
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${
                    isOpen ? "text-primary rotate-180" : "text-secondary"
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 bg-surface-container-lowest">
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const sections: AccordionSectionProps[] = [
  {
    id: "booking",
    icon: <Calendar />,
    title: "Booking & Appointments",
    items: [
      {
        question: "How do I schedule my first consultation?",
        answer:
          "You can schedule your first consultation by visiting our booking page, selecting your preferred specialist, and choosing an available time slot. You'll receive a confirmation email with all the details.",
      },
      {
        question: "Can I reschedule or cancel my appointment?",
        answer:
          "Yes, you can reschedule or cancel your appointment through the patient portal up to 24 hours before your scheduled time without any penalty. Log in to your account, navigate to My Appointments, and select the desired action. For cancellations within 24 hours, please contact our support team directly.",
      },
      {
        question: "Is there a waiting list for specialists?",
        answer:
          "Yes, if your preferred specialist is fully booked, you can join a waiting list. You'll be notified automatically if a slot becomes available.",
      },
    ],
  },
  {
    id: "payments",
    icon: <CreditCardIcon />,
    title: "Payments & Insurance",
    items: [
      {
        question: "Which insurance providers do you accept?",
        answer:
          "We accept most major insurance providers. Please contact our billing team or check the insurance section of your patient portal for a full list of accepted providers.",
      },
      {
        question: "How do I access my billing statements?",
        answer:
          "Billing statements are available in your patient portal under the Billing section. You can view, download, and print statements for any past visits.",
      },
      {
        question: "Are payment plans available for out-of-pocket costs?",
        answer:
          "Yes, we offer flexible payment plans for patients with out-of-pocket expenses. Please speak with our billing department to set up a plan that works for you.",
      },
    ],
  },
  {
    id: "consultations",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    title: "Consultations & Care",
    items: [
      {
        question: "How do virtual telehealth consultations work?",
        answer:
          "Telehealth consultations are conducted via our secure video platform. After booking, you'll receive a link to join your session at the scheduled time. All you need is a device with a camera and microphone.",
      },
      {
        question: "How can I view my lab results?",
        answer:
          "Lab results are posted to your patient portal as soon as they are processed, usually within 1-3 business days. You'll receive an email notification when results are available.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="grow pt-32 pb-24 px-8 max-w-container-max mx-auto w-full">
      {/* Hero */}
      <section className="mb-20 text-center max-w-3xl mx-auto">
        <h1 className="font-display text-display text-on-background mb-6">
          How can we help?
        </h1>
        <p className="font-body-lg text-body-lg text-secondary mb-10">
          Search our knowledge base or browse categories below to find answers
          to common questions about Lumina Health services.
        </p>
        <div className="relative max-w-2xl mx-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
            size={20}
          />
          <input
            className="w-full pl-12 pr-6 py-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-body-lg font-body-lg transition-all hover:shadow-md"
            placeholder="Search for answers..."
            type="text"
          />
        </div>
      </section>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <aside className="md:col-span-3 sticky top-32 hidden md:block">
          <nav className="space-y-2">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                className="block px-4 py-3 rounded-lg text-secondary font-body-md text-body-md hover:bg-surface-container hover:text-on-surface transition-colors border-l-4 border-transparent"
              >
                {s.title}
              </Link>
            ))}
          </nav>
          <div className="mt-8 p-6 rounded-xl bg-secondary-container/30 border border-secondary-fixed-dim/20">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">
              Still need help?
            </h3>
            <p className="font-body-md text-body-md text-secondary mb-4">
              Our support team is available 24/7 to assist you.
            </p>
            <button className="w-full py-2.5 px-4 rounded-lg bg-white border border-outline-variant text-on-surface font-label-sm text-label-sm hover:bg-surface-container-lowest transition-colors shadow-sm flex items-center justify-center gap-2">
              Contact Support
            </button>
          </div>
        </aside>

        {/* FAQ content */}
        <div className="md:col-span-9 space-y-16">
          {sections.map((s) => (
            <AccordionSection key={s.id} {...s} />
          ))}
        </div>
      </div>
    </main>
  );
}
