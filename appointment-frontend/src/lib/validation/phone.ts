import { z } from 'zod';

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidIndianMobile(phone: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobile(phone));
}

export function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const indianMobileSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .transform(normalizeIndianMobile)
  .refine(isValidIndianMobile, 'Enter a valid 10-digit Indian mobile number');

export const optionalIndianMobileSchema = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? normalizeIndianMobile(v) : ''))
  .refine((v) => !v || isValidIndianMobile(v), 'Enter a valid 10-digit Indian mobile number');

export const contactOrEmailSchema = z
  .string()
  .min(1, 'Mobile or email is required')
  .superRefine((value, ctx) => {
    if (value.includes('@')) {
      if (!isEmailLike(value)) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid email address' });
      }
      return;
    }
    if (!isValidIndianMobile(value)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid 10-digit Indian mobile number or email',
      });
    }
  });
