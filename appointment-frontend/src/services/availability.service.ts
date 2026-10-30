import { apiFetch } from '@/lib/api';

export const availabilityService = {
  get: (token: string) =>
    apiFetch('/availability', { method: 'GET' }, token),

  create: (token: string, input: { dayOfWeek: number; startTime: string; endTime: string; slotMins: number }) =>
    apiFetch('/availability', { method: 'POST', body: JSON.stringify(input) }, token),

  deleteAll: (token: string) =>
    apiFetch('/availability', { method: 'DELETE' }, token),
};
