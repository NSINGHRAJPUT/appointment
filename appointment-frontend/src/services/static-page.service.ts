import { apiFetch } from '@/lib/api';

export type StaticPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
};

export const staticPageService = {
  getBySlug: (slug: string) =>
    apiFetch<StaticPage | null>(`/static-pages/${slug}`).catch(() => null),

  getAll: (token: string) =>
    apiFetch<StaticPage[]>('/static-pages', undefined, token),

  upsert: (token: string, slug: string, data: { title: string; content: string }) =>
    apiFetch<StaticPage>(`/static-pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) }, token),
};
