/**
 * Input validation and sanitization utilities
 * Ensures strict security against injection, XSS, and malformed inputs.
 */

export const ValidationUtils = {
  /**
   * Validates Indian 10-digit mobile number or international E.164 phone.
   */
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    // Indian 10-digit mobile (starts with 6-9) or with +91/91 prefix
    const indianRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    // General E.164 international format (up to 15 digits)
    const e164Regex = /^\+?[1-9]\d{6,14}$/;
    return indianRegex.test(clean) || e164Regex.test(clean);
  },

  /**
   * Sanitizes phone number by removing whitespace and special characters.
   */
  sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '').trim();
  },

  /**
   * Validates standard email address.
   */
  isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Sanitizes email by lowercasing and trimming.
   */
  sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  },

  /**
   * Sanitizes strings by stripping HTML tags and null bytes to prevent XSS.
   */
  sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/\0/g, '') // remove null bytes
      .replace(/<[^>]*>?/gm, '') // strip HTML tags
      .trim();
  },

  /**
   * Validates a student certificate verification code (e.g. VIAR-2026-WIA-9842).
   */
  isValidCertificateCode(code: string): boolean {
    if (!code) return false;
    const certRegex = /^VIAR-\d{4}-[A-Z0-9]{2,10}-\d+$/i;
    return certRegex.test(code.trim());
  },

  /**
   * Validates URL safely.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },
};
