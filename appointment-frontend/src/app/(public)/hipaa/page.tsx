import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import LegalDocumentLayout from '@/components/public/LegalDocumentLayout';

export const metadata: Metadata = buildMetadata({
  title: 'Data Protection & Health Information',
  description:
    'How PawCare protects pet health records and personal data. Our commitment to secure veterinary telehealth and clinic booking.',
  path: '/hipaa',
  keywords: ['pet health data', 'veterinary data protection', 'secure telehealth'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Data Protection', url: `${SITE.url}/hipaa` },
]);

const SECTIONS = [
  {
    id: 'overview',
    title: 'Our commitment',
    content: (
      <>
        <p>
          PawCare handles sensitive pet health information shared during bookings, video consultations, and
          messaging between pet parents and veterinarians. We apply strong technical and organizational
          safeguards aligned with industry best practices for health-adjacent platforms.
        </p>
        <p>
          While veterinary records in India may not fall under HIPAA (a U.S. healthcare law), we adopt
          comparable principles: minimum necessary access, encryption, audit trails, and user control.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-protect',
    title: 'What information is protected',
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>Pet symptoms, diagnoses, and treatment notes shared in consultations.</li>
        <li>Appointment history, prescriptions, and follow-up recommendations.</li>
        <li>Messages and files exchanged between you and your veterinarian.</li>
        <li>Account credentials and payment records linked to healthcare transactions.</li>
      </ul>
    ),
  },
  {
    id: 'safeguards',
    title: 'Security safeguards',
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>TLS encryption for data in transit; encryption at rest for stored records.</li>
        <li>Role-based access — only authorized staff and your assigned vet can view relevant data.</li>
        <li>Regular security assessments and vulnerability monitoring.</li>
        <li>Secure video infrastructure for telehealth sessions.</li>
        <li>Incident response procedures for suspected breaches.</li>
      </ul>
    ),
  },
  {
    id: 'vet-responsibilities',
    title: 'Veterinarian responsibilities',
    content: (
      <p>
        Veterinarians using PawCare are independent professionals responsible for maintaining appropriate
        clinical records and following applicable veterinary regulations. They access only the information
        needed to provide care for your pet and must not share it outside the platform without your consent
        except as required by law.
      </p>
    ),
  },
  {
    id: 'your-controls',
    title: 'Your controls',
    content: (
      <>
        <p>You can:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Review appointment history and messages in your dashboard.</li>
          <li>Request a copy or correction of your data via privacy@pawcare.com.</li>
          <li>Request account deletion subject to legal retention requirements.</li>
        </ul>
        <p>
          For full details on data collection and rights, see our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: 'breach',
    title: 'Breach notification',
    content: (
      <p>
        If a data breach affecting your personal or pet health information occurs, we will notify affected
        users and relevant authorities as required by applicable law, and take immediate steps to contain
        and remediate the incident.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact our privacy team',
    content: (
      <p>
        Questions about data protection? Email{' '}
        <a href="mailto:privacy@pawcare.com" className="text-primary hover:underline">
          privacy@pawcare.com
        </a>{' '}
        or contact us through our{' '}
        <Link href="/contact" className="text-primary hover:underline">
          support page
        </Link>
        .
      </p>
    ),
  },
];

export default function HipaaPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <LegalDocumentLayout
        title="Data Protection & Health Information"
        lastUpdated="June 30, 2026"
        sections={SECTIONS}
        relatedLinks={[
          { href: '/privacy', label: 'Privacy Policy' },
          { href: '/terms', label: 'Terms of Service' },
          { href: '/cookies', label: 'Cookie Policy' },
        ]}
      />
    </>
  );
}
