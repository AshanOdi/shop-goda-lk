/**
 * Money helpers. SPEC 5.1: every amount is LKR in integer cents (Rs 5,050.00 → 505000).
 * All money maths in the app goes through this file, so no floating-point number
 * ever touches a price or a total.
 */

/** An amount in LKR cents. Always a safe integer. */
export type Cents = number;

function assertCents(amount: number): Cents {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money must be a whole number of cents, got ${amount}`);
  }
  return amount;
}

function assertQuantity(quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a whole number of 0 or more, got ${quantity}`);
  }
  return quantity;
}

/** Whole rupees to cents: `fromRupees(5050)` → 505000. */
export function fromRupees(rupees: number): Cents {
  if (!Number.isSafeInteger(rupees)) {
    throw new RangeError(`Rupees must be a whole number, got ${rupees}`);
  }
  return assertCents(rupees * 100);
}

export function add(a: Cents, b: Cents): Cents {
  return assertCents(assertCents(a) + assertCents(b));
}

export function subtract(a: Cents, b: Cents): Cents {
  return assertCents(assertCents(a) - assertCents(b));
}

/** Unit price × quantity, e.g. one order line. */
export function multiply(amount: Cents, quantity: number): Cents {
  return assertCents(assertCents(amount) * assertQuantity(quantity));
}

export function sum(amounts: readonly Cents[]): Cents {
  return amounts.reduce<Cents>((total, amount) => add(total, amount), 0);
}

export function min(a: Cents, b: Cents): Cents {
  return Math.min(assertCents(a), assertCents(b));
}

export function max(a: Cents, b: Cents): Cents {
  return Math.max(assertCents(a), assertCents(b));
}

/**
 * `percent`% of `amount`, rounded down to whole rupees.
 * SPEC 7.3: percent coupons round the discount down to whole rupees,
 * so 10% of Rs 1,234.56 is Rs 123, never Rs 123.46.
 */
export function percentOfRoundedDownToRupees(amount: Cents, percent: number): Cents {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`Percent must be a whole number from 0 to 100, got ${percent}`);
  }
  if (assertCents(amount) < 0) {
    throw new RangeError(`Amount must not be negative, got ${amount}`);
  }
  // amount × percent / 100 gives cents; a further / 100 gives rupees. Integer-only division:
  const scaled = amount * percent;
  const wholeRupees = (scaled - (scaled % 10_000)) / 10_000;
  return wholeRupees * 100;
}

const RUPEES_INPUT = /^(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/i;

/**
 * Parses what a seller types into a price field: "5050", "5,050.50", "Rs 5050.5".
 * Returns cents, or null when the text is not a valid non-negative amount.
 * Works on the text itself, so "0.1" can never become 0.1000000001.
 */
export function parseRupees(input: string): Cents | null {
  const match = RUPEES_INPUT.exec(input.trim());
  if (!match) return null;
  const rupees = Number(match[1].replaceAll(",", ""));
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = rupees * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** SPEC 5.1 display format: "Rs 5,050" when there are no cents, "Rs 5,050.50" otherwise. */
export function formatLKR(amount: Cents): string {
  assertCents(amount);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  const rupees = groupThousands(String(Math.floor(absolute / 100)));
  const cents = absolute % 100;
  return cents === 0
    ? `${sign}Rs ${rupees}`
    : `${sign}Rs ${rupees}.${String(cents).padStart(2, "0")}`;
}

/** Plain two-decimal amount, as payment gateways expect: 505000 → "5050.00" (SPEC 7.7). */
export function toDecimalString(amount: Cents): string {
  assertCents(amount);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}
