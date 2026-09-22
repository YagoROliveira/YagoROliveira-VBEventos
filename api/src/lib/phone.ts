const MIN_DIGITS = 10;
const MAX_DIGITS = 13;

export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS;
}
