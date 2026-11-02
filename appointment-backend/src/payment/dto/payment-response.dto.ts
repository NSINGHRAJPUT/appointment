import { PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CheckoutSessionResponseDto {
  sessionId: string;
  sessionUrl: string;
  appointmentId: string;
}

export type VerifySessionStatus =
  | 'SUCCEEDED'
  | 'PENDING'
  | 'CANCELLED'
  | 'FAILED';

export class VerifySessionAppointmentDto {
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

export class VerifySessionResponseDto {
  status: VerifySessionStatus;
  appointment: VerifySessionAppointmentDto;
  payment?: Pick<PaymentResponseDto, 'status' | 'amount' | 'currency'>;
}
