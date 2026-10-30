import { apiFetch } from '@/lib/api';

export const otpService = {
  send: (
    target: string,
    type: 'PHONE' | 'EMAIL',
    alsoNotifyEmail?: string,
  ) =>
    apiFetch<{ message: string }>('/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        target,
        type,
        ...(alsoNotifyEmail ? { alsoNotifyEmail } : {}),
      }),
    }),

  verify: (target: string, type: 'PHONE' | 'EMAIL', code: string) =>
    apiFetch<{ verified: boolean }>('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ target, type, code }),
    }),
};
