import { apiFetch } from '@/lib/api';

export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export const appointmentService = {
  // Works for both patient and doctor — returns caller's own appointments
  myAppointments: (token: string) =>
    apiFetch('/appointments/me', undefined, token),

  getById: (token: string, id: string) =>
    apiFetch(`/appointments/${id}`, undefined, token),

  book: (
    token: string,
    input: {
      doctorId: string;
      startAt: string;
      endAt: string;
      reason?: string;
      isInstant?: boolean;
    },
  ) =>
    apiFetch('/appointments', { method: 'POST', body: JSON.stringify(input) }, token),

  bookAsGuest: (input: {
    doctorId: string;
    startAt: string;
    endAt: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    otpCode: string;
    otpTarget: string;
    otpType: 'PHONE' | 'EMAIL';
    reason?: string;
    isInstant?: boolean;
  }) =>
    apiFetch('/appointments/guest', { method: 'POST', body: JSON.stringify(input) }),

  publicLookup: (input: { query: string }) =>
    apiFetch<{
      appointments: Array<{
        id: string;
        status: string;
        startAt: string;
        endAt: string;
        reason?: string | null;
        paymentStatus?: string | null;
        patientName?: string;
        maskedPhone?: string | null;
        maskedEmail?: string | null;
        doctor: {
          fullName: string;
          specialization?: string | null;
          clinicName?: string | null;
        };
      }>;
    }>('/appointments/public-lookup', {
      method: 'POST',
      body: JSON.stringify({ query: input.query.trim() }),
    }),

  updateStatus: (token: string, appointmentId: string, status: AppointmentStatus) =>
    apiFetch(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token),
};
