/**
 * Sri Lankan mobile numbers. SPEC 5.2: accept the formats people actually type,
 * store E.164 (+947XXXXXXXX), display as "077 123 4567".
 */

// A Sri Lankan mobile number without the country code or leading 0: 7 + 8 digits.
const LOCAL_MOBILE = /^7\d{8}$/;
const E164_MOBILE = /^\+947\d{8}$/;

/**
 * Accepts 07XXXXXXXX, 7XXXXXXXX, +947XXXXXXXX or 947XXXXXXXX, with spaces or dashes.
 * Returns the E.164 form, or null when the input isn't a Sri Lankan mobile number.
 */
export function normalizePhone(input: string): string | null {
  const compact = input.trim().replace(/[\s-]/g, "");

  let local: string;
  if (compact.startsWith("+94")) {
    local = compact.slice(3);
  } else if (compact.startsWith("94") && compact.length === 11) {
    local = compact.slice(2);
  } else if (compact.startsWith("0")) {
    local = compact.slice(1);
  } else {
    local = compact;
  }

  return LOCAL_MOBILE.test(local) ? `+94${local}` : null;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** "+94771234567" → "077 123 4567". Anything else is returned unchanged. */
export function formatPhone(e164: string): string {
  if (!E164_MOBILE.test(e164)) return e164;
  const local = e164.slice(3);
  return `0${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}
