import { apiFetch } from '@/lib/api';

export interface CreateCheckoutSessionRequest {
  appointmentId: string;
  doctorId: string;
  patientIdentifier: string;
  currency?: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
  appointmentId: string;
}

export interface VerifySessionRequest {
  sessionId: string;
}

export type VerifySessionStatus =
  | 'SUCCEEDED'
  | 'PENDING'
  | 'CANCELLED'
  | 'FAILED';

export interface PaymentSummary {
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
}

export interface AppointmentWithPayment {
  id: string;
  doctorId: string;
  status: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
  patientPhone?: string | null;
  patientEmail?: string | null;
  doctor?: {
    user?: { fullName?: string | null };
    specialization?: string | null;
    clinicName?: string | null;
  };
}

export interface VerifySessionResponse {
  status: VerifySessionStatus;
  appointment: AppointmentWithPayment;
  payment?: PaymentSummary;
}

export const paymentService = {
  createCheckoutSession: async (
    input: CreateCheckoutSessionRequest,
  ): Promise<CreateCheckoutSessionResponse> => {
    return apiFetch<CreateCheckoutSessionResponse>(
      '/payments/create-session',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },

  verifySession: async (
    input: VerifySessionRequest,
  ): Promise<VerifySessionResponse> => {
    return apiFetch<VerifySessionResponse>(
      '/payments/verify-session',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },

  getPayment: async (
    appointmentId: string,
    token?: string,
  ) => {
    return apiFetch(
      `/payments/${appointmentId}`,
      undefined,
      token,
    );
  },
};
