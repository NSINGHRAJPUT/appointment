import { apiFetch } from '@/lib/api';

export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export const callService = {
  start: (token: string, appointmentId: string, type?: 'AUDIO' | 'VIDEO') =>
    apiFetch(
      `/call/${appointmentId}/start`,
      { method: 'POST', body: JSON.stringify({ type: type ?? 'VIDEO' }) },
      token,
    ),

  end: (token: string, appointmentId: string) =>
    apiFetch(
      `/call/${appointmentId}/end`,
      { method: 'POST', body: JSON.stringify({}) },
      token,
    ),

  getIceServers: (token: string, appointmentId?: string) => {
    const qs = appointmentId
      ? `?appointmentId=${encodeURIComponent(appointmentId)}`
      : '';
    return apiFetch<{ iceServers: IceServer[] }>(
      `/call/ice-servers${qs}`,
      undefined,
      token,
    );
  },
};
