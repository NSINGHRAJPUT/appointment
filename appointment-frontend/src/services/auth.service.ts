import { apiFetch } from '@/lib/api';
import { getStoredToken } from '@/hooks/use-auth';

export type AuthPayload = { accessToken: string };

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phone: string;
  gender?: string;
  licenseNumber?: string;
  experience?: string;
  degree?: string;
  university?: string;
  graduationYear?: string;
  primarySpecialty?: string;
  subSpecialties?: string[];
  conditions?: string[];
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
  country?: string;
  consultationFee?: string;
  onlineConsultation?: boolean;
  slots?: Array<{ day: string; from: string; to: string }>;
  whatsapp?: string;
  whatsappOptOut?: boolean;
  documents?: File[];
};

export const authService = {
  register: (input: RegisterInput, onProgress?: (progress: number) => void) => {
    // If there are documents, use FormData for multipart upload
    if (input.documents && input.documents.length > 0) {
      const formData = new FormData();

      // Add all text fields to FormData
      formData.append('email', input.email);
      formData.append('password', input.password);
      formData.append('fullName', input.fullName);
      formData.append('role', input.role);
      formData.append('phone', input.phone);
      if (input.gender) formData.append('gender', input.gender);
      if (input.licenseNumber) formData.append('licenseNumber', input.licenseNumber);
      if (input.experience) formData.append('experience', input.experience);
      if (input.degree) formData.append('degree', input.degree);
      if (input.university) formData.append('university', input.university);
      if (input.graduationYear) formData.append('graduationYear', input.graduationYear);
      if (input.primarySpecialty) {
        formData.append('primarySpecialty', input.primarySpecialty);
        formData.append('specialization', input.primarySpecialty);
      }
      if (input.subSpecialties) formData.append('subSpecialties', JSON.stringify(input.subSpecialties));
      if (input.conditions) formData.append('conditions', JSON.stringify(input.conditions));
      if (input.clinicName) formData.append('clinicName', input.clinicName);
      if (input.clinicAddress) formData.append('clinicAddress', input.clinicAddress);
      if (input.city) formData.append('city', input.city);
      if (input.country) formData.append('country', input.country);
      if (input.consultationFee) formData.append('consultationFee', input.consultationFee);
      if (input.onlineConsultation !== undefined) formData.append('onlineConsultation', String(input.onlineConsultation));
      if (input.slots) formData.append('slots', JSON.stringify(input.slots));
      if (input.whatsapp) formData.append('whatsapp', input.whatsapp);
      if (input.whatsappOptOut !== undefined) formData.append('whatsappOptOut', String(input.whatsappOptOut));

      // Add files to FormData
      input.documents.forEach((file, index) => {
        formData.append('documents', file);
      });

      // Create XMLHttpRequest to track upload progress
      return new Promise<AuthPayload>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText) as AuthPayload;
              resolve(response);
            } catch (err) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || `Request failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Request failed: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        const token = typeof window !== 'undefined' ? getStoredToken() : null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        xhr.open('POST', `${apiUrl}/auth/register`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    }

    // For registrations without documents, use standard JSON request
    const payload =
      input.role === 'DOCTOR' && input.primarySpecialty
        ? { ...input, specialization: input.primarySpecialty }
        : input;

    return apiFetch<AuthPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login: (input: { email: string; password: string }) =>
    apiFetch<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: (token: string) => apiFetch('/auth/me', undefined, token),
};
