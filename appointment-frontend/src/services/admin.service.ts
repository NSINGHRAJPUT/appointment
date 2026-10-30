import { apiFetch } from '@/lib/api';

export const adminService = {
  dashboard: (token: string) =>
    apiFetch<{
      users: number;
      doctors: number;
      patients: number;
      pendingDoctors: number;
      appointments: number;
    }>('/admin/dashboard', undefined, token),

  approveDoctor: (token: string, doctorId: string, approve: boolean, notes?: string) =>
    apiFetch(`/admin/doctors/${doctorId}/approval`, { method: 'PATCH', body: JSON.stringify({ approve, notes }) }, token),

  pendingDoctors: (token: string, page: number = 1, pageSize: number = 10) =>
    apiFetch(`/admin/doctors/pending?page=${page}&pageSize=${pageSize}`, undefined, token),

  allDoctors: (token: string, page: number = 1, pageSize: number = 20) =>
    apiFetch(`/admin/doctors?page=${page}&pageSize=${pageSize}`, undefined, token),

  allUsers: (token: string, page: number = 1, pageSize: number = 50, role?: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (role) params.set('role', role);
    return apiFetch(`/admin/users?${params.toString()}`, undefined, token);
  },

  allAppointments: (token: string, page: number = 1, pageSize: number = 20) =>
    apiFetch(`/admin/appointments?page=${page}&pageSize=${pageSize}`, undefined, token),

  getUserDetails: (token: string, userId: string) =>
    apiFetch(`/admin/users/${userId}`, undefined, token),

  updateUser: (token: string, userId: string, data: { fullName?: string; phoneNumber?: string; gender?: string; whatsappNumber?: string }) =>
    apiFetch(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  updateUserProfile: (token: string, userId: string, data: any) =>
    apiFetch(`/admin/users/${userId}/profile`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  deactivateUser: (token: string, userId: string) =>
    apiFetch(`/admin/users/${userId}/deactivate`, { method: 'PATCH' }, token),

  activateUser: (token: string, userId: string) =>
    apiFetch(`/admin/users/${userId}/activate`, { method: 'PATCH' }, token),
};
