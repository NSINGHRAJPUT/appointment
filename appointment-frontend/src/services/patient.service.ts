import { apiFetch } from '@/lib/api';

export const patientService = {
  getProfile: (token: string) => apiFetch('/patients/me', undefined, token),

  updateProfile: (
    token: string,
    input: {
      fullName?: string;
      phoneNumber?: string;
      whatsappNumber?: string;
      gender?: string;
      dateOfBirth?: string;
      address?: string;
    },
  ) =>
    apiFetch('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }, token),
};
