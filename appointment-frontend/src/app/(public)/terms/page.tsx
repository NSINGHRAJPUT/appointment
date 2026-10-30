import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import LegalDocumentLayout from '@/components/public/LegalDocumentLayout';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'Review the PawCare Terms of Service. Understand your rights and responsibilities when booking vet care on our platform.',
  path: '/terms',
  keywords: ['terms of service', 'pawcare terms', 'vet platform legal'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Terms of Service', url: `${SITE.url}/terms` },
]);

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of terms',
    content: (
      <>
        <p>
          By accessing or using PawCare, you agree to these Terms of Service and our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the platform.
        </p>
        <p>
          We may update these terms from time to time. Material changes will be communicated via email
          or a notice on the platform. Continued use after changes constitutes acceptance.
        </p>
      </>
    ),
  },
  {
    id: 'services',
    title: '2. Our services',
    content: (
      <>
        <p>
          PawCare provides a technology platform that connects pet parents with independent licensed
          veterinarians for online video consultations, instant consults, and in-clinic appointments.
        </p>
        <p>
          PawCare does not provide veterinary medical services directly. Veterinarians on the platform are
          independent professionals responsible for the care they deliver.
        </p>
      </>
    ),
  },
  {
    id: 'responsibilities',
    title: '3. User responsibilities',
    content: (
      <>
        <p>As a user, you agree to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide accurate registration and pet health information.</li>
          <li>Keep your account credentials secure and notify us of unauthorized access.</li>
          <li>Use the platform only for lawful purposes related to pet care.</li>
          <li>Attend scheduled appointments or cancel with reasonable notice.</li>
          <li>Not misuse, scrape, or disrupt the platform or other users.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'vet-disclaimer',
    title: '4. Veterinary & emergency disclaimer',
    content: (
      <div className="rounded-xl border border-secondary/30 bg-secondary-container/40 p-5">
        <p className="mb-3">
          <strong>PawCare is not an emergency service.</strong> If your pet has life-threatening symptoms
          — including difficulty breathing, severe bleeding, collapse, seizures, or suspected poisoning —
          go to the nearest emergency veterinary clinic immediately.
        </p>
        <p>
          Online consultations are not a substitute for hands-on examination when clinically required.
          Veterinarians may recommend in-clinic visits based on your pet&apos;s condition. Advice provided
          through PawCare is between you and your chosen veterinarian.
        </p>
      </div>
    ),
  },
  {
    id: 'payments',
    title: '5. Payments & cancellations',
    content: (
      <>
        <p>
          Consultation fees are set by individual veterinarians and displayed before booking. Payment is
          processed at the time of booking unless otherwise stated for in-clinic visits.
        </p>
        <p>
          Cancellation and refund policies vary by veterinarian and are shown at checkout. Generally,
          cancellations made at least 24 hours in advance qualify for a full refund. Late cancellations may
          incur fees.
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: '6. Privacy & data',
    content: (
      <p>
        Your use of PawCare is also governed by our{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link href="/hipaa" className="text-primary hover:underline">
          Data Protection
        </Link>{' '}
        page. We implement safeguards for pet health and personal information as described therein.
      </p>
    ),
  },
  {
    id: 'liability',
    title: '7. Limitation of liability',
    content: (
      <>
        <p>
          To the maximum extent permitted by law, PawCare is not liable for indirect, incidental, or
          consequential damages arising from use of the platform or veterinary services provided by
          independent veterinarians.
        </p>
        <p>
          Our total liability for claims related to the platform is limited to the fees you paid to
          PawCare in the twelve months preceding the claim.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: '8. Governing law',
    content: (
      <p>
        These Terms are governed by the laws of India. Disputes shall be subject to the exclusive
        jurisdiction of courts in Bengaluru, Karnataka, unless otherwise required by applicable consumer
        protection law.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <LegalDocumentLayout title="Terms of Service" lastUpdated="June 30, 2026" sections={SECTIONS} />
    </>
  );
}
