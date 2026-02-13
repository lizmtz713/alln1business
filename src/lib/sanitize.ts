/**
 * Input sanitization for form fields to reduce injection risk and enforce limits.
 * Supabase uses parameterized queries (SQL injection is server-side mitigated);
 * these helpers guard against excessive length, control characters, and normalize input.
 */

const CONTROL_AND_NULL = /[\x00-\x1f\x7f]/g;

/** Max lengths (align with DB where applicable) */
export const MAX_LENGTHS = {
  email: 320,
  password: 512,
  /** Generic short text: names, labels */
  shortText: 500,
  /** Descriptions, notes */
  longText: 10_000,
  /** Invoice/category-style codes */
  code: 100,
} as const;

/**
 * Strip control characters and null bytes from a string.
 */
function stripControlChars(s: string): string {
  return s.replace(CONTROL_AND_NULL, '');
}

/**
 * Sanitize email: trim, lowercase, strip control chars, enforce max length.
 */
export function sanitizeEmail(input: string): string {
  const s = stripControlChars(String(input).trim().toLowerCase());
  return s.length > MAX_LENGTHS.email ? s.slice(0, MAX_LENGTHS.email) : s;
}

/**
 * Validate email format (after sanitization). Returns true if valid.
 */
export function isValidEmailFormat(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * Sanitize text for storage: trim, strip control chars, enforce max length.
 */
export function sanitizeText(
  input: string,
  maxLength: number = MAX_LENGTHS.shortText
): string {
  const s = stripControlChars(String(input).trim());
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

/**
 * Password: do not modify (allow special chars). Only enforce max length to avoid abuse.
 */
export function sanitizePasswordInput(input: string): string {
  const s = String(input);
  return s.length > MAX_LENGTHS.password ? s.slice(0, MAX_LENGTHS.password) : s;
}

/**
 * Sanitize for display (e.g. prevent breaking layout). Trims and strips control chars.
 */
export function sanitizeForDisplay(input: string, maxLength?: number): string {
  const s = stripControlChars(String(input).trim());
  if (maxLength != null && s.length > maxLength) return s.slice(0, maxLength);
  return s;
}
