import { InvalidEmailFormatException } from '../exceptions/invalid-email-format.exception';
import { InvalidPhoneFormatException } from '../exceptions/invalid-phone-format.exception';

/**
 * RFC 5322 compliant email validation regex
 * Validates email format according to RFC 5322 standard
 * Pattern: local-part@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * More strict email validation that rejects consecutive dots
 */
function isValidEmail(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }
  // Reject consecutive dots
  if (email.includes('..')) {
    return false;
  }
  // Reject starting or ending with dot
  if (email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  return true;
}

/**
 * E.164 phone format validation regex
 * Validates phone numbers in E.164 format: +1234567890
 */
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Validates email format using RFC 5322 regex
 * @param email - Email address to validate
 * @throws InvalidEmailFormatException if email format is invalid
 */
export function validateEmailFormat(email: string): void {
  if (!email || !isValidEmail(email)) {
    throw new InvalidEmailFormatException();
  }
}

/**
 * Validates phone format using E.164 regex
 * @param phone - Phone number to validate
 * @throws InvalidPhoneFormatException if phone format is invalid
 */
export function validatePhoneFormat(phone: string): void {
  if (!phone || !PHONE_REGEX.test(phone)) {
    throw new InvalidPhoneFormatException();
  }
}

/**
 * Validates password length (minimum 8 characters)
 * @param password - Password to validate
 * @throws PasswordTooShortException if password is too short
 */
export function validatePasswordLength(password: string): void {
  const { PasswordTooShortException } = require('../exceptions/password-too-short.exception');
  if (!password || password.length < 8) {
    throw new PasswordTooShortException();
  }
}
