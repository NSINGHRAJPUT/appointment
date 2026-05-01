import { apiFetch } from '@/lib/api';

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

  updateSettings: (token: string, input: { bookingMode?: 'INSTANT' | 'APPROVAL_REQUIRED'; isOnline?: boolean; responseTimeMins?: number }) =>
    apiFetch('/doctors/settings', { method: 'PATCH', body: JSON.stringify(input) }, token),

  instantAvailable: () =>
    apiFetch('/doctors/instant'),
};
