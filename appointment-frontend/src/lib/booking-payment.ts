import { paymentService } from '@/services/payment.service';

export async function redirectToCheckoutIfNeeded(opts: {
  appointmentId: string;
  doctorId: string;
  priceCents: number;
  currency: string;
  patientIdentifier: string;
}): Promise<'redirected' | 'free'> {
  if (opts.priceCents <= 0) {
    return 'free';
  }

  const checkout = await paymentService.createCheckoutSession({
    appointmentId: opts.appointmentId,
    doctorId: opts.doctorId,
    patientIdentifier: opts.patientIdentifier,
    currency: opts.currency,
  });

  window.location.href = checkout.sessionUrl;
  return 'redirected';
}
