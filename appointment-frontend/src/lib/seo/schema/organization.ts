import { SITE } from '../seo.config';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}${SITE.logo}`,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.email,
      contactType: 'customer support',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '100 Innovation Drive, Suite 400',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94103',
      addressCountry: 'US',
    },
    sameAs: Object.values(SITE.social),
  };
}
