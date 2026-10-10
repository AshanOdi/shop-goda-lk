# 002 — Money, phone numbers and unit tests

**Milestone:** M0 · **Branch:** m0/lib-money-phone · **Commits:**
`chore: add vitest for unit tests` ·
`feat(lib): add money helpers with tests` ·
`feat(lib): add phone number normalisation with tests`

## What we built

Two small helper files every other part of Ape Kade depends on: `money.ts` does all price maths and formats amounts as "Rs 5,050", and `phone.ts` turns any way a buyer types a Sri Lankan mobile number into one standard form. We also added Vitest, a tool that runs automated tests, and wrote tests that prove both files behave correctly.

## Why it matters

Totals on orders, receipts and waybills are calculated with `money.ts`. If it were wrong, a buyer could be charged the wrong amount, which breaks "the one rule". Phone numbers identify customers (one customer per phone per shop), so `077 123 4567` and `+94771234567` must be stored as the *same* value, or one buyer would show up as two customers.

## New concepts

### Why cents, not rupees?

Computers store decimals like `0.1` in binary, which can't represent them exactly:

```js
0.1 + 0.2; // 0.30000000000000004
```

Integers don't have this problem. So we store Rs 5,050.50 as `505050` cents and only turn it into "Rs 5,050.50" when we display it. Every helper in `money.ts` checks its inputs with `Number.isSafeInteger` and throws if a decimal slips in. A crash in development is far better than a wrong total in production.

### E.164 phone format

E.164 is the international standard: `+`, country code, number, no spaces (`+94771234567`). Storing one format means database lookups ("has this phone ordered before?") just work.

### Regular expressions (regex)

A pattern for matching text. In `phone.ts`:

```ts
const LOCAL_MOBILE = /^7\d{8}$/;
```

`^` = start, `7` = the digit 7, `\d{8}` = exactly 8 digits, `$` = end. So it matches `771234567` and nothing longer or shorter. Try patterns at https://regex101.com (pick "ECMAScript").

### Unit tests with Vitest

A **unit test** calls one function with an input and checks the output. Vitest finds files ending in `.test.ts` and runs them.

```ts
import { describe, expect, it } from "vitest";

describe("formatLKR", () => {          // a group of related tests
  it("drops .00", () => {              // one test case, described in words
    expect(formatLKR(505000)).toBe("Rs 5,050"); // the check
  });
});
```

`it.each([...])` runs the same test for many rows of input, which is how we cover every phone format the spec lists without copy-pasting. Docs: https://vitest.dev/guide/

### TypeScript: `type` aliases and `| null`

```ts
export type Cents = number;                        // a readable name for number
export function normalizePhone(input: string): string | null
```

`Cents` is still just a `number`, but it tells readers what the number means. `string | null` ("string or null") forces callers to handle the invalid case: TypeScript won't let you use the result as a string until you've checked it isn't `null`.

### The `@/` import alias

`import { formatLKR } from "@/lib/money"` means `src/lib/money.ts`. It's set in `tsconfig.json` (for the app) and repeated in `vitest.config.mts` (for tests).

## How it works

Buyer types `077-123-4567` at checkout → `normalizePhone()` removes spaces and dashes → strips `+94`, `94` or `0` from the front → checks what's left is `7` + 8 digits → returns `+94771234567` (or `null`, and the form shows an error) → saved in the database → shown to the seller with `formatPhone()` as `077 123 4567`.

Seller types `2,450.50` as a price → `parseRupees()` → `245050` cents saved → buyer sees `formatLKR(245050)` = `Rs 2,450.50`.

## Files changed

| File | What it does |
| --- | --- |
| `vitest.config.mts` | Tells Vitest where tests live and how `@/` imports resolve |
| `package.json` | `test`, `test:watch` scripts; `check` now also runs tests |
| `src/lib/money.ts` | Cents arithmetic, percentage rounding, parsing and formatting |
| `src/lib/phone.ts` | Normalise, validate and format Sri Lankan mobile numbers |
| `tests/unit/money.test.ts` | Tests for every money helper, including rejected inputs |
| `tests/unit/phone.test.ts` | Tests for every accepted and rejected phone format (SPEC 5.2) |

## Key code, explained

```ts
export function percentOfRoundedDownToRupees(amount: Cents, percent: number): Cents {
  // ...input checks...
  const scaled = amount * percent;
  const wholeRupees = (scaled - (scaled % 10_000)) / 10_000;
  return wholeRupees * 100;
}
```

- SPEC 7.3 says a percent coupon's discount rounds **down** to whole rupees.
- `amount * percent` is still an integer. Dividing by 100 would give cents, and by another 100 rupees, so 10,000 in total.
- `scaled % 10_000` is the leftover part of a rupee. Subtracting it first means the division is always exact, so no decimals ever appear.
- Example: 10% of Rs 1,234.56 → `123456 × 10 = 1234560` → leftover `4560` → `1230000 / 10000 = 123` rupees → `12300` cents = Rs 123.

## Try it yourself

```bash
pnpm test                 # run all tests once
pnpm test:watch           # re-runs tests every time you save a file (q to quit)
```

Experiment: in `src/lib/money.ts`, change `"Rs "` to `"LKR "` inside `formatLKR` and save while `pnpm test:watch` runs. Watch the `formatLKR` tests fail and show expected vs received. Undo with `git checkout src/lib/money.ts`.

## Check your understanding

1. How is Rs 99.95 stored in the database?
2. Why does `normalizePhone` return `null` instead of throwing an error?
3. What does `it.each` save us from?

<details>
<summary>Answers</summary>

1. `9995` (cents, an integer).
2. A badly typed phone number is normal user input, not a bug. Returning `null` lets the form show a friendly message. Throwing is for programmer mistakes, like passing `0.5` cents to `add`.
3. Writing a separate `it(...)` block for every input. One table of rows runs as many tests.

</details>

## Words to know

- **Cents**: 1/100 of a rupee; our unit for every amount.
- **E.164**: the international phone number format, `+94771234567`.
- **Regex**: a text-matching pattern.
- **Unit test**: an automated check of one function's output for a given input.
- **Assertion**: the `expect(...).toBe(...)` line that decides whether a test passes.
- **Watch mode**: tests re-run automatically when files change.
