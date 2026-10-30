import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import LegalDocumentLayout from '@/components/public/LegalDocumentLayout';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'Read the PawCare Privacy Policy. Learn how we collect, use, and protect your personal and pet health information.',
  path: '/privacy',
  keywords: ['privacy policy', 'pet data protection', 'pawcare privacy'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Privacy Policy', url: `${SITE.url}/privacy` },
]);

const SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <>
        <p>
          PawCare Technologies Pvt. Ltd. (&ldquo;PawCare,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates a
          platform that connects pet parents with licensed veterinarians for online and in-clinic care.
          This Privacy Policy explains what information we collect, how we use it, and the choices you have.
        </p>
        <p>
          By using PawCare, you agree to the practices described here. If you do not agree, please do not
          use our services.
        </p>
      </>
    ),
  },
  {
    id: 'data-collection',
    title: 'Information we collect',
    content: (
      <>
        <p>We collect information necessary to provide veterinary booking and consultation services:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account information:</strong> name, email, phone number, and password credentials.
          </li>
          <li>
            <strong>Pet information:</strong> species, breed, age, symptoms, and consultation notes you provide.
          </li>
          <li>
            <strong>Booking & payment data:</strong> appointment history, transaction records, and billing details.
          </li>
          <li>
            <strong>Communications:</strong> messages with veterinarians, support tickets, and call metadata.
          </li>
          <li>
            <strong>Technical data:</strong> device type, IP address, browser, and usage analytics to improve the platform.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'use-of-data',
    title: 'How we use your information',
    content: (
      <>
        <p>We use collected data to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Facilitate appointments between you and verified veterinarians.</li>
          <li>Process payments and send booking confirmations and reminders.</li>
          <li>Enable secure video consultations and in-app messaging.</li>
          <li>Verify veterinarian credentials and maintain platform safety.</li>
          <li>Respond to support requests and improve our services.</li>
          <li>Comply with legal obligations and prevent fraud or abuse.</li>
        </ul>
        <p>We do not sell your personal or pet health information to third parties for marketing purposes.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'When we share information',
    content: (
      <>
        <p>We may share information only in these circumstances:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>With your veterinarian:</strong> appointment details, pet symptoms, and messages relevant to care.
          </li>
          <li>
            <strong>Service providers:</strong> payment processors, cloud hosting, SMS/email delivery — under strict contracts.
          </li>
          <li>
            <strong>Legal requirements:</strong> when required by law, court order, or to protect rights and safety.
          </li>
          <li>
            <strong>Business transfers:</strong> in connection with a merger or acquisition, with notice where required.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights & choices',
    content: (
      <>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access, correct, or delete your personal information.</li>
          <li>Export a copy of your data.</li>
          <li>Opt out of non-essential marketing communications.</li>
          <li>Withdraw consent where processing is consent-based.</li>
        </ul>
        <p>
          To exercise these rights, contact{' '}
          <a href="mailto:privacy@pawcare.com" className="text-primary hover:underline">
            privacy@pawcare.com
          </a>
          . We will respond within applicable legal timeframes.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security & retention',
    content: (
      <>
        <p>
          We use encryption in transit (TLS) and at rest, access controls, and regular security reviews to
          protect your data. No system is 100% secure; please use a strong password and keep your account
          credentials private.
        </p>
        <p>
          We retain information as long as needed to provide services, comply with law, and resolve
          disputes. You may request deletion subject to legal retention requirements.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <p>
        Questions about this policy? Email{' '}
        <a href="mailto:privacy@pawcare.com" className="text-primary hover:underline">
          privacy@pawcare.com
        </a>{' '}
        or write to PawCare Technologies Pvt. Ltd., Koramangala, Bengaluru, Karnataka 560034, India.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <LegalDocumentLayout title="Privacy Policy" lastUpdated="June 30, 2026" sections={SECTIONS} />
    </>
  );
}
