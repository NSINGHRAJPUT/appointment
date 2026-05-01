import { apiFetch } from '@/lib/api';

export type AuthPayload = { accessToken: string };

export const authService = {
  register: (input: { email: string; password: string; fullName: string; role: 'PATIENT' | 'DOCTOR' | 'ADMIN' }) =>
    apiFetch<AuthPayload>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: (token: string) => apiFetch('/auth/me', undefined, token),
};
