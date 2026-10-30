import { z } from 'zod';
import {
  indianMobileSchema,
  optionalIndianMobileSchema,
  isValidIndianMobile,
  isEmailLike,
  normalizeIndianMobile,
} from './phone';

export { optionalIndianMobileSchema, indianMobileSchema, isValidIndianMobile, normalizeIndianMobile };

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export const otpSchema = z
  .string()
  .min(4, 'Enter the verification code')
  .max(8, 'Invalid verification code');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const patientRegisterSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: indianMobileSchema,
});

export const doctorRegisterSchema = patientRegisterSchema.extend({
  specialization: z.string().min(2, 'Specialization is required'),
  clinicName: z.string().optional(),
  licenseNumber: z.string().min(3, 'License number is required'),
});

export const guestBookingSchema = z.object({
  patientName: nameSchema,
  patientPhone: indianMobileSchema,
  patientEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  otpCode: otpSchema,
});

export const publicLookupSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, 'Enter appointment ID, mobile number, or email'),
  })
  .superRefine((data, ctx) => {
    const query = data.query;
    if (query.includes('@') && !isEmailLike(query)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid email address',
        path: ['query'],
      });
      return;
    }
    if (/^[\d+\s\-()]+$/.test(query) && !isValidIndianMobile(query)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid 10-digit Indian mobile number',
        path: ['query'],
      });
    }
  });

export const contactFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: optionalIndianMobileSchema,
  topic: z.string().min(1),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const profileUpdateSchema = z.object({
  fullName: nameSchema.optional(),
  phone: optionalIndianMobileSchema,
  specialization: z.string().optional(),
  clinicName: z.string().optional(),
  bio: z.string().max(2000).optional(),
});

export const patientProfileUpdateSchema = z.object({
  fullName: nameSchema,
  phoneNumber: optionalIndianMobileSchema,
  whatsappNumber: optionalIndianMobileSchema,
  gender: z.string().max(30).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Validation failed';
}
