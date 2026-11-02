const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidIndianMobile(input: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobile(input));
}

export function phoneDigitsMatch(a: string, b: string): boolean {
  return normalizeIndianMobile(a) === normalizeIndianMobile(b);
}

/** DB values to try when looking up by phone (handles 10-digit vs 91-prefixed storage). */
export function phoneLookupDbValues(query: string): string[] {
  const trimmed = query.trim();
  const normalized = normalizeIndianMobile(trimmed);
  const values = new Set<string>([trimmed, normalized]);
  if (normalized.length === 10) {
    values.add(`91${normalized}`);
  }
  if (normalized.length === 12 && normalized.startsWith('91')) {
    values.add(normalized.slice(2));
  }
  return [...values];
}

export function normalizeContactIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return normalizeIndianMobile(trimmed);
}

export function contactMatchesAppointment(
  identifier: string,
  patientPhone?: string | null,
  patientEmail?: string | null,
): boolean {
  const normalized = normalizeContactIdentifier(identifier);
  if (normalized.includes('@')) {
    return (patientEmail?.trim().toLowerCase() ?? '') === normalized;
  }
  if (!patientPhone) return false;
  return phoneDigitsMatch(normalized, patientPhone);
}

export function maskIndianMobile(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = normalizeIndianMobile(phone);
  if (digits.length !== 10) return '**********';
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

export function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '***@***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedLocal =
    local.length <= 1 ? '*' : `${local[0]}${'*'.repeat(Math.min(3, local.length - 1))}`;
  return `${maskedLocal}@${domain}`;
}
