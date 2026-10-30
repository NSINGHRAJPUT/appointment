import { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/dashboard/admin/',
          '/auth/',
          '/payment/',
          '/booking/cancel',
          '/booking/success',
          '/appointments/',
          '/call/',
          '/chat/',
          '/communication/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
