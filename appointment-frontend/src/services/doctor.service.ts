import { apiFetch } from '@/lib/api';

export type SpecialtyCountsResponse = {
  counts: { label: string; count: number }[];
};

export const doctorService = {
  list: (params: URLSearchParams) =>
    apiFetch(`/doctors?${params.toString()}`),

  getById: (id: string) =>
    apiFetch(`/doctors/${id}`),

  nextSlots: (id: string, from: string | undefined, count: number) =>
    apiFetch(
      `/doctors/${id}/next-slots?${new URLSearchParams(
        Object.fromEntries([
          ...(from ? [['from', from]] : []),
          ['count', String(count)],
        ]),
      ).toString()}`,
    ),

  onboarding: (token: string, input: Record<string, unknown>) =>
    apiFetch('/doctors/onboarding', { method: 'POST', body: JSON.stringify(input) }, token),

  getProfile: (token: string) =>
    apiFetch('/doctors/profile', { method: 'GET' }, token),

  updateProfile: (token: string, input: Record<string, unknown>) =>
    apiFetch('/doctors/profile', { method: 'PUT', body: JSON.stringify(input) }, token),

  submitOnboarding: (token: string) =>
    apiFetch('/doctors/onboarding/submit', { method: 'PATCH' }, token),

  updateSettings: (token: string, input: { bookingMode?: 'INSTANT' | 'APPROVAL_REQUIRED'; isOnline?: boolean; responseTimeMins?: number }) =>
    apiFetch('/doctors/settings', { method: 'PATCH', body: JSON.stringify(input) }, token),

  instantAvailable: () =>
    apiFetch('/doctors/instant'),

  specialtyCounts: (labels: string[]) =>
    apiFetch<SpecialtyCountsResponse>(
      `/doctors/specialty-counts?${new URLSearchParams({ labels: labels.join(',') }).toString()}`,
    ),

  listDocuments: (token: string) =>
    apiFetch('/doctors/documents', { method: 'GET' }, token),

  uploadDocument: (token: string, file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return apiFetch('/doctors/documents', { method: 'POST', body: formData }, token);
  },

  deleteDocument: (token: string, documentId: string) =>
    apiFetch(`/doctors/documents/${documentId}`, { method: 'DELETE' }, token),
};
