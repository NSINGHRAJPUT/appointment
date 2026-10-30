import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import InstantConsultPageInner from './page-client';

export const metadata: Metadata = buildMetadata({
  title: 'Instant Consult — Book the Next Available Vet Slot',
  description:
    'Book the soonest open slot with an online veterinarian and connect for a video consult on PawCare.',
  path: '/instant',
  keywords: ['instant consult', 'online vet now', 'pet telehealth', 'talk to vet instantly'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Instant Consult', url: `${SITE.url}/instant` },
]);

export default function InstantPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <InstantConsultPageInner />
    </>
  );
}
