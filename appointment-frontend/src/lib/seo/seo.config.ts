export const SITE = {
  name: 'PawCare',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://pawcare.com',
  description:
    'Book online and in-clinic vet consultations for your pets. Instant video visits, clinic appointments, and specialist pet care on PawCare.',
  logo: '/logo.png',
  ogImage: '/og.jpg',
  ogImageWidth: 1376,
  ogImageHeight: 768,
  twitterHandle: '@pawcare',
  email: 'support@pawcare.com',
  address: '100 Innovation Drive, Suite 400, San Francisco, CA 94103',
  phone: '',
  social: {
    twitter: 'https://twitter.com/pawcare',
    facebook: 'https://facebook.com/pawcare',
    linkedin: 'https://linkedin.com/company/pawcare',
  },
} as const;
