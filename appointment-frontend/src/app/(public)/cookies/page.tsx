import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import LegalDocumentLayout from '@/components/public/LegalDocumentLayout';

export const metadata: Metadata = buildMetadata({
  title: 'Cookie Policy',
  description:
    'Learn how PawCare uses cookies and similar technologies to improve your experience on our pet vet booking platform.',
  path: '/cookies',
  keywords: ['cookie policy', 'pawcare cookies', 'tracking technologies'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Cookie Policy', url: `${SITE.url}/cookies` },
]);

const SECTIONS = [
  {
    id: 'what-are-cookies',
    title: 'What are cookies?',
    content: (
      <p>
        Cookies are small text files stored on your device when you visit a website. They help us remember
        your preferences, keep you signed in, and understand how the platform is used so we can improve it.
      </p>
    ),
  },
  {
    id: 'types',
    title: 'Types of cookies we use',
    content: (
      <>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Essential cookies:</strong> Required for authentication, security, and core booking
            functionality. The platform cannot work properly without these.
          </li>
          <li>
            <strong>Functional cookies:</strong> Remember your language, location preferences, and session
            settings for a smoother experience.
          </li>
          <li>
            <strong>Analytics cookies:</strong> Help us understand page visits, feature usage, and errors so
            we can fix issues and improve performance. Data is aggregated where possible.
          </li>
          <li>
            <strong>Marketing cookies (optional):</strong> Used only with your consent to measure campaign
            effectiveness. We do not use aggressive third-party ad tracking.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party cookies',
    content: (
      <p>
        Some cookies are set by trusted partners such as payment processors and analytics providers. These
        partners are contractually required to handle data securely and only for the purposes we specify.
      </p>
    ),
  },
  {
    id: 'manage',
    title: 'Managing your preferences',
    content: (
      <>
        <p>You can control cookies in several ways:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Adjust your browser settings to block or delete cookies.</li>
          <li>Use private/incognito browsing modes.</li>
          <li>Opt out of non-essential analytics via your account settings where available.</li>
        </ul>
        <p>
          Blocking essential cookies may prevent you from signing in or completing bookings. For questions,
          contact{' '}
          <a href="mailto:privacy@pawcare.com" className="text-primary hover:underline">
            privacy@pawcare.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    title: 'Updates to this policy',
    content: (
      <p>
        We may update this Cookie Policy as our practices or regulations change. The &ldquo;Last
        updated&rdquo; date at the top reflects the most recent revision. See also our{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <LegalDocumentLayout
        title="Cookie Policy"
        lastUpdated="June 30, 2026"
        sections={SECTIONS}
        relatedLinks={[
          { href: '/privacy', label: 'Privacy Policy' },
          { href: '/terms', label: 'Terms of Service' },
          { href: '/hipaa', label: 'Data Protection' },
        ]}
      />
    </>
  );
}
