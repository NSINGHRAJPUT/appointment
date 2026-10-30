import { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';
import { env } from '@/lib/env';

const BACKEND = env.apiUrl;

async function fetchDoctorIds(): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND}/doctors?page=1&pageSize=200&sortBy=next`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((d: { id: string }) => d.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/doctors`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/instant`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/appointment-lookup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blogs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/hipaa`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const doctorIds = await fetchDoctorIds();
  const doctorRoutes: MetadataRoute.Sitemap = doctorIds.map((id) => ({
    url: `${base}/doctors/${id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...doctorRoutes];
}
