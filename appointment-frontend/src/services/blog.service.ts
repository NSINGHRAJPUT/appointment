import { apiFetch } from '@/lib/api';

export type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage: string | null;
  category: string;
  author: string;
  readMins: number;
  publishedAt: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  createdAt?: string;
};

export type BlogListResponse = {
  items: Blog[];
  total: number;
  page: number;
  pageSize: number;
};

export const blogService = {
  list: (page = 1, pageSize = 9, category?: string) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) q.set('category', category);
    return apiFetch<BlogListResponse>(`/blogs?${q}`);
  },

  getBySlug: (slug: string) => apiFetch<Blog>(`/blogs/${slug}`),

  // Admin
  listAll: (token: string, page = 1, pageSize = 20) =>
    apiFetch<BlogListResponse>(`/blogs/admin/all?page=${page}&pageSize=${pageSize}`, undefined, token),

  create: (token: string, data: Omit<Blog, 'id' | 'publishedAt' | 'createdAt'>) =>
    apiFetch<Blog>('/blogs/admin', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (token: string, id: string, data: Partial<Omit<Blog, 'id' | 'publishedAt' | 'createdAt'>>) =>
    apiFetch<Blog>(`/blogs/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  remove: (token: string, id: string) =>
    apiFetch<Blog>(`/blogs/admin/${id}`, { method: 'DELETE' }, token),

  uploadImage: async (token: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch<{ url: string }>(
      '/blogs/admin/upload-image',
      { method: 'POST', body: form },
      token,
    );
    return res.url;
  },
};
