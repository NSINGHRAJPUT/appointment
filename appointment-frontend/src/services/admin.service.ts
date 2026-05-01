import { apiFetch } from '@/lib/api';

export const adminService = {
  dashboard: (token: string) => apiFetch<{ users: number; pendingDoctors: number; appointments: number }>('/admin/dashboard', undefined, token),

  approveDoctor: (token: string, doctorId: string, approve: boolean, notes?: string) =>
    apiFetch(`/admin/doctors/${doctorId}/approval`, { method: 'PATCH', body: JSON.stringify({ approve, notes }) }, token),

  pendingDoctors: (token: string, page: number = 1, pageSize: number = 10) =>
    apiFetch(`/admin/doctors/pending?page=${page}&pageSize=${pageSize}`, undefined, token),

  allDoctors: (token: string, page: number = 1, pageSize: number = 20) =>
    apiFetch(`/admin/doctors?page=${page}&pageSize=${pageSize}`, undefined, token),

  allUsers: (token: string, page: number = 1, pageSize: number = 20) =>
    apiFetch(`/admin/users?page=${page}&pageSize=${pageSize}`, undefined, token),

  allAppointments: (token: string, page: number = 1, pageSize: number = 20) =>
    apiFetch(`/admin/appointments?page=${page}&pageSize=${pageSize}`, undefined, token),
};
