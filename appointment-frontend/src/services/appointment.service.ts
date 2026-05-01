import { apiFetch } from '@/lib/api';

export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export const appointmentService = {
  // Works for both patient and doctor — returns caller's own appointments
  myAppointments: (token: string) =>
    apiFetch('/appointments/me', undefined, token),

  getById: (token: string, id: string) =>
    apiFetch(`/appointments/${id}`, undefined, token),

  book: (token: string, input: { doctorId: string; startAt: string; endAt: string; reason?: string }) =>
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

  updateStatus: (token: string, appointmentId: string, status: AppointmentStatus) =>
    apiFetch(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token),
};
