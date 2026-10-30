import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbSchema, faqSchema, SITE } from '@/lib/seo';
import FaqPageClient from '@/components/faq/FaqPageClient';
import { ALL_FAQ_ITEMS } from '@/lib/public-content/faq-data';

export const metadata: Metadata = buildMetadata({
  title: 'FAQ — Pet Vet Booking & Consultation Help',
  description:
    'Find answers about booking vet appointments, online consultations, payments, cancellations, and pet care on PawCare.',
  path: '/faq',
  keywords: ['faq', 'vet booking help', 'pet telehealth faq', 'pawcare support'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'FAQ', url: `${SITE.url}/faq` },
]);

export default function FaqPage() {
  return (
    <>
      <JsonLd schema={[BC, faqSchema(ALL_FAQ_ITEMS)]} />
      <FaqPageClient />
    </>
  );
}
