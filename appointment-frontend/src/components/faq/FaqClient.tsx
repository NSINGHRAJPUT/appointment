'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CreditCardIcon, Search } from 'lucide-react';
import { AccordionSection } from './AccordionSection';

const sections = [
  {
    id: 'booking',
    icon: <Calendar />,
    title: 'Booking & Appointments',
    items: [
      {
        question: 'How do I schedule my first consultation?',
        answer:
          "You can schedule your first consultation by visiting our booking page, selecting your preferred specialist, and choosing an available time slot. You'll receive a confirmation email with all the details.",
      },
      {
        question: 'Can I reschedule or cancel my appointment?',
        answer:
          'Yes, you can reschedule or cancel your appointment through the patient portal up to 24 hours before your scheduled time without any penalty. Log in to your account, navigate to My Appointments, and select the desired action.',
      },
      {
        question: 'Is there a waiting list for specialists?',
        answer:
          "Yes, if your preferred specialist is fully booked, you can join a waiting list. You'll be notified automatically if a slot becomes available.",
      },
    ],
  },
  {
    id: 'payments',
    icon: <CreditCardIcon />,
    title: 'Payments & Insurance',
    items: [
      {
        question: 'Which insurance providers do you accept?',
        answer:
          'We accept most major insurance providers. Please contact our billing team or check the insurance section of your patient portal for a full list of accepted providers.',
      },
      {
        question: 'How do I access my billing statements?',
        answer:
          'Billing statements are available in your patient portal under the Billing section. You can view, download, and print statements for any past visits.',
      },
      {
        question: 'Are payment plans available for out-of-pocket costs?',
        answer:
          'Yes, we offer flexible payment plans for patients with out-of-pocket expenses. Please speak with our billing department to set up a plan that works for you.',
      },
    ],
  },
  {
    id: 'consultations',
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
    title: 'Consultations & Care',
    items: [
      {
        question: 'How do virtual telehealth consultations work?',
        answer:
          "Telehealth consultations are conducted via our secure video platform. After booking, you'll receive a link to join your session at the scheduled time. All you need is a device with a camera and microphone.",
      },
      {
        question: 'How can I view my lab results?',
        answer:
          'Lab results are posted to your patient portal as soon as they are processed, usually within 1-3 business days. You\'ll receive an email notification when results are available.',
      },
    ],
  },
];

export default function FaqClient() {
  const [query, setQuery] = useState('');

  const filteredSections = query.trim()
    ? sections
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (item) =>
              item.question.toLowerCase().includes(query.toLowerCase()) ||
              item.answer.toLowerCase().includes(query.toLowerCase()),
          ),
        }))
        .filter((s) => s.items.length > 0)
    : sections;

  return (
    <main className="grow pt-32 pb-24 px-8 max-w-container-max mx-auto w-full">
      {/* Hero */}
      <section className="mb-20 text-center max-w-3xl mx-auto">
        <h1 className="font-display text-display text-on-background mb-6">How can we help?</h1>
        <p className="font-body-lg text-body-lg text-secondary mb-10">
          Search our knowledge base or browse categories below to find answers to common questions
          about PawCare services.
        </p>
        <div className="relative max-w-2xl mx-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
            size={20}
          />
          <input
            className="w-full pl-12 pr-6 py-4 rounded-full border border-outline-variant bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-body-lg font-body-lg transition-all hover:shadow-md"
            placeholder="Search for answers..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          <div className="mt-8 p-6 rounded-full bg-secondary-container/30 border border-secondary-fixed-dim/20">
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Still need help?</h3>
            <p className="font-body-md text-body-md text-secondary mb-4">
              Our support team is available 24/7 to assist you.
            </p>
            <Link
              href="/contact"
              className="block w-full py-2.5 px-4 rounded-lg bg-white border border-outline-variant text-on-surface font-label-sm text-label-sm hover:bg-surface-container-lowest transition-colors shadow-sm text-center"
            >
              Contact Support
            </Link>
          </div>
        </aside>

        {/* FAQ content */}
        <div className="md:col-span-9 space-y-16">
          {filteredSections.length === 0 ? (
            <p className="text-on-surface-variant text-center py-12">
              No results found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filteredSections.map((s) => <AccordionSection key={s.id} {...s} />)
          )}
        </div>
      </div>
    </main>
  );
}
