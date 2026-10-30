import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbSchema, SITE } from '@/lib/seo';
import ContactPageClient from '@/components/contact/ContactPageClient';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us — PawCare Support',
  description:
    'Get in touch with PawCare for appointment help, billing questions, technical support, or vet partnership inquiries.',
  path: '/contact',
  keywords: ['contact pawcare', 'vet support', 'pet healthcare help'],
});

const BC = breadcrumbSchema([
  { name: 'Home', url: SITE.url },
  { name: 'Contact', url: `${SITE.url}/contact` },
]);

export default function ContactPage() {
  return (
    <>
      <JsonLd schema={BC} />
      <ContactPageClient />
    </>
  );
}
