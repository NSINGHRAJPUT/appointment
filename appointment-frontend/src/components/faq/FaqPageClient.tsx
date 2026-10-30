'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  HelpCircle,
  Monitor,
  Search,
  Shield,
  User,
} from 'lucide-react';
import PublicPageHero from '@/components/public/PublicPageHero';
import PageCtaStrip from '@/components/public/PageCtaStrip';
import { AccordionSection } from '@/components/faq/AccordionSection';
import { FAQ_SECTIONS } from '@/lib/public-content/faq-data';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  booking: <Calendar size={20} />,
  payments: <CreditCard size={20} />,
  consultations: <Monitor size={20} />,
  account: <User size={20} />,
};

export default function FaqPageClient() {
  const [query, setQuery] = useState('');

  const filteredSections = query.trim()
    ? FAQ_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query.toLowerCase()) ||
            item.answer.toLowerCase().includes(query.toLowerCase()),
        ),
      })).filter((section) => section.items.length > 0)
    : FAQ_SECTIONS;

  return (
    <>
      <PublicPageHero
        badge="Help center"
        title="Frequently asked questions"
        description="Everything pet parents ask about booking vets, online consults, payments, and account support on PawCare."
        primaryCta={{ href: '/contact', label: 'Contact support' }}
        secondaryCta={{ href: '/doctors', label: 'Find a vet' }}
      />

      <main className="bg-surface-container-low/30">
      <div className="max-w-container-max mx-auto px-margin py-14 md:py-20">
        <div className="relative max-w-2xl mx-auto mb-14">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={20}
          />
          <input
            className="w-full rounded-2xl border border-outline-variant bg-white py-4 pl-12 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Search questions about bookings, payments, consults…"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <aside className="lg:col-span-3 hidden lg:block sticky top-24 space-y-6">
            <nav className="rounded-2xl border border-outline-variant bg-white p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                Categories
              </p>
              {FAQ_SECTIONS.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors"
                >
                  {section.title}
                </Link>
              ))}
            </nav>

            <div className="rounded-2xl border border-primary/20 bg-primary-container/40 p-6">
              <HelpCircle className="text-primary mb-3" size={24} />
              <h3 className="font-bold text-on-surface mb-2">Still need help?</h3>
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                Our support team can help with bookings, refunds, and technical issues.
              </p>
              <Link
                href="/contact"
                className="block w-full rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity"
              >
                Contact support
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-14">
            {filteredSections.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-outline-variant bg-white">
                <Shield className="mx-auto mb-3 text-on-surface-variant" size={28} />
                <p className="text-on-surface-variant">
                  No results for &ldquo;{query}&rdquo;. Try different keywords or{' '}
                  <Link href="/contact" className="text-primary font-medium hover:underline">
                    contact us
                  </Link>
                  .
                </p>
              </div>
            ) : (
              filteredSections.map((section) => (
                <AccordionSection
                  key={section.id}
                  id={section.id}
                  icon={SECTION_ICONS[section.id] ?? <HelpCircle size={20} />}
                  title={section.title}
                  items={section.items}
                />
              ))
            )}
          </div>
        </div>
      </div>
      </main>

      <PageCtaStrip
        title="Didn't find your answer?"
        description="Our team is here to help with bookings, vet matching, and anything else you need for your pet's care."
      />
    </>
  );
}
