'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  SendHorizontal,
  Siren,
} from 'lucide-react';
import PublicPageHero from '@/components/public/PublicPageHero';
import PageCtaStrip from '@/components/public/PageCtaStrip';
import { contactFormSchema, formatZodError } from '@/lib/validation/schemas';
import { PhoneInput } from '@/components/ui/phone-input';

const TOPICS = [
  'General inquiry',
  'Booking & appointments',
  'Payments & refunds',
  'Technical support',
  'Vet partnership',
  'Other',
];

export default function ContactPageClient() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const parsed = contactFormSchema.safeParse({
      firstName,
      lastName,
      email,
      phone,
      topic,
      message,
    });
    if (!parsed.success) {
      alert(formatZodError(parsed.error));
      setSubmitting(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <>
      <PublicPageHero
        badge="Contact us"
        title="We're here for you and your pet"
        description="Questions about bookings, vets, payments, or partnerships? Reach out — our support team typically responds within one business day."
      />

      <main className="bg-surface-container-low/40">
      <div className="max-w-container-max mx-auto px-margin py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="rounded-2xl border border-outline-variant bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
                  <Check size={28} strokeWidth={2.5} />
                </div>
                <h2 className="font-bold text-2xl md:text-3xl text-on-surface mb-2">Message sent!</h2>
                <p className="text-on-surface-variant mb-6 leading-relaxed">
                  Thanks for reaching out. We will get back to you at{' '}
                  <strong className="text-on-surface">{email}</strong> as soon as possible.
                </p>
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                >
                  Browse FAQ while you wait
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant bg-white p-8 md:p-10 shadow-sm">
                <h2 className="font-bold text-2xl text-on-surface mb-2">Send a message</h2>
                <p className="text-sm text-on-surface-variant mb-8">
                  Fill in the form below and we will route your request to the right team.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-on-surface mb-1.5">
                        First name
                      </label>
                      <input
                        id="first_name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-on-surface mb-1.5">
                        Last name
                      </label>
                      <input
                        id="last_name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-1.5">
                      Phone number
                    </label>
                    <PhoneInput
                      id="phone"
                      value={phone}
                      onChange={setPhone}
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-1.5">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-on-surface mb-1.5">
                      Topic
                    </label>
                    <select
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-on-surface mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help you and your pet…"
                      className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-on-primary hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-error/30 bg-error-container/30 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error/15 text-error">
                  <Siren size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface mb-1">Pet emergency?</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                    PawCare is not an emergency service. If your pet has severe symptoms, go to the
                    nearest emergency veterinary clinic immediately.
                  </p>
                  <p className="text-sm font-semibold text-error">Call your local emergency vet</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-white p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email support
                </p>
                <a href="mailto:support@pawcare.com" className="font-medium text-on-surface hover:text-primary">
                  support@pawcare.com
                </a>
                <p className="text-xs text-on-surface-variant mt-1">Mon–Sat, 9am–7pm IST</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-white p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Phone
                </p>
                <a href="tel:+911800123456" className="font-medium text-on-surface hover:text-primary">
                  +91 1800-123-456
                </a>
                <p className="text-xs text-on-surface-variant mt-1">General support (not for emergencies)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-white p-6 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Headquarters
                </p>
                <p className="font-medium text-on-surface text-sm leading-relaxed">
                  PawCare Technologies Pvt. Ltd.
                  <br />
                  Koramangala, Bengaluru
                  <br />
                  Karnataka 560034, India
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary-container/30 p-6">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Clock size={18} />
                <span className="font-semibold text-sm">Response time</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Most inquiries receive a reply within 24 hours on business days. For booking issues,
                check the{' '}
                <Link href="/faq" className="text-primary font-medium hover:underline">
                  FAQ
                </Link>{' '}
                first.
              </p>
              <Link
                href="/instant"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <MessageCircle size={16} />
                Need a vet right now? Try instant consult
              </Link>
            </div>
          </aside>
        </div>
      </div>
      </main>

      <PageCtaStrip />
    </>
  );
}
