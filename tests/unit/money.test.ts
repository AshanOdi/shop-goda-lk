import { describe, expect, it } from "vitest";
import {
  add,
  formatLKR,
  fromRupees,
  max,
  min,
  multiply,
  parseRupees,
  percentOfRoundedDownToRupees,
  subtract,
  sum,
  toDecimalString,
} from "@/lib/money";

describe("fromRupees", () => {
  it("converts whole rupees to cents", () => {
    expect(fromRupees(5050)).toBe(505000);
    expect(fromRupees(0)).toBe(0);
  });

  it("rejects fractional rupees", () => {
    expect(() => fromRupees(50.5)).toThrow(RangeError);
  });
});

describe("arithmetic", () => {
  it("adds and subtracts cents exactly", () => {
    // The classic float bug: 0.1 + 0.2 !== 0.3. In cents it is exact.
    expect(add(10, 20)).toBe(30);
    expect(subtract(505000, 40000)).toBe(465000);
    expect(subtract(100, 250)).toBe(-150);
  });

  it("multiplies a unit price by a quantity", () => {
    expect(multiply(245000, 3)).toBe(735000);
    expect(multiply(245000, 0)).toBe(0);
  });

  it("rejects fractional or negative quantities", () => {
    expect(() => multiply(1000, 1.5)).toThrow(RangeError);
    expect(() => multiply(1000, -1)).toThrow(RangeError);
  });

  it("sums a list of amounts", () => {
    expect(sum([245000, 120000, 40000])).toBe(405000);
    expect(sum([])).toBe(0);
  });

  it("returns the smaller or larger amount", () => {
    expect(min(500, 300)).toBe(300);
    expect(max(500, 300)).toBe(500);
  });

  it("rejects non-integer amounts everywhere", () => {
    expect(() => add(0.1, 0.2)).toThrow(RangeError);
    expect(() => subtract(100, 0.5)).toThrow(RangeError);
    expect(() => multiply(10.5, 2)).toThrow(RangeError);
    expect(() => sum([100, Number.NaN])).toThrow(RangeError);
  });

  it("rejects results beyond the safe integer range", () => {
    expect(() => add(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
  });
});

describe("percentOfRoundedDownToRupees", () => {
  it("takes a percentage in whole rupees", () => {
    expect(percentOfRoundedDownToRupees(505000, 10)).toBe(50500);
  });

  it("rounds down to whole rupees", () => {
    // 10% of Rs 1,234.56 = Rs 123.456 → Rs 123
    expect(percentOfRoundedDownToRupees(123456, 10)).toBe(12300);
    // 15% of Rs 99.99 = Rs 14.9985 → Rs 14
    expect(percentOfRoundedDownToRupees(9999, 15)).toBe(1400);
  });

  it("handles 0% and 100%", () => {
    expect(percentOfRoundedDownToRupees(505000, 0)).toBe(0);
    expect(percentOfRoundedDownToRupees(505000, 100)).toBe(505000);
    // 100% still rounds down: Rs 50.50 → Rs 50
    expect(percentOfRoundedDownToRupees(5050, 100)).toBe(5000);
  });

  it("rejects invalid percentages and negative amounts", () => {
    expect(() => percentOfRoundedDownToRupees(1000, 101)).toThrow(RangeError);
    expect(() => percentOfRoundedDownToRupees(1000, -5)).toThrow(RangeError);
    expect(() => percentOfRoundedDownToRupees(1000, 12.5)).toThrow(RangeError);
    expect(() => percentOfRoundedDownToRupees(-1000, 10)).toThrow(RangeError);
  });
});

describe("parseRupees", () => {
  it.each([
    ["5050", 505000],
    ["5,050", 505000],
    ["5050.50", 505050],
    ["5050.5", 505050],
    ["5,050.05", 505005],
    ["Rs 5,050", 505000],
    ["Rs. 5050.50", 505050],
    ["rs5050", 505000],
    ["  400  ", 40000],
    ["0", 0],
    ["0.1", 10],
    ["1,234,567.89", 123456789],
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseRupees(input)).toBe(expected);
  });

  it.each(["", "abc", "-100", "5.505", "50,50", "1,23,456", "5050.", ".50", "Rs", "1e5", "50 50"])(
    "rejects %j",
    (input) => {
      expect(parseRupees(input)).toBeNull();
    },
  );
});

describe("formatLKR", () => {
  it.each([
    [505000, "Rs 5,050"],
    [505050, "Rs 5,050.50"],
    [505005, "Rs 5,050.05"],
    [0, "Rs 0"],
    [50, "Rs 0.50"],
    [123456789, "Rs 1,234,567.89"],
    [100000000, "Rs 1,000,000"],
    [-40000, "-Rs 400"],
  ])("formats %i as %j", (amount, expected) => {
    expect(formatLKR(amount)).toBe(expected);
  });
});

describe("toDecimalString", () => {
  it.each([
    [505000, "5050.00"],
    [505050, "5050.50"],
    [5, "0.05"],
    [0, "0.00"],
  ])("formats %i as %j", (amount, expected) => {
    expect(toDecimalString(amount)).toBe(expected);
  });
});
