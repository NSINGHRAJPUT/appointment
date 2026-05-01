import { apiFetch } from '@/lib/api';

export const callService = {
  start: (token: string, appointmentId: string, type?: 'AUDIO' | 'VIDEO') =>
    apiFetch(`/call/${appointmentId}/start`, { method: 'POST', body: JSON.stringify({ type }) }, token),
};

