import type { Metadata } from 'next';
import { Manrope, Source_Sans_3 } from 'next/font/google';
import { AppChrome } from '@/components/app-chrome';
import { JsonLd, websiteSchema, organizationSchema, SITE } from '@/lib/seo';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
});

const defaultOgImage = SITE.ogImage.startsWith('http')
  ? SITE.ogImage
  : `${SITE.url}${SITE.ogImage}`;

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  robots: { index: true, follow: true },
  icons: {
    icon: SITE.logo,
    apple: SITE.logo,
  },
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: defaultOgImage,
        width: SITE.ogImageWidth,
        height: SITE.ogImageHeight,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitterHandle,
    images: [defaultOgImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${sourceSans.variable}`}>
      <body className="font-body antialiased">
        <JsonLd schema={[websiteSchema({ searchPath: '/doctors' }), organizationSchema()]} />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
