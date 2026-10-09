import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it.each([
    // 07XXXXXXXX
    ["0771234567", "+94771234567"],
    ["077 123 4567", "+94771234567"],
    ["077-123-4567", "+94771234567"],
    ["077 - 123 - 4567", "+94771234567"],
    // 7XXXXXXXX
    ["771234567", "+94771234567"],
    ["77 123 4567", "+94771234567"],
    // +947XXXXXXXX
    ["+94771234567", "+94771234567"],
    ["+94 77 123 4567", "+94771234567"],
    ["+94-77-123-4567", "+94771234567"],
    // 947XXXXXXXX
    ["94771234567", "+94771234567"],
    ["94 77 123 4567", "+94771234567"],
    // surrounding whitespace
    ["  0771234567  ", "+94771234567"],
    // other mobile prefixes
    ["0701234567", "+94701234567"],
    ["0781234567", "+94781234567"],
  ])("accepts %j as %j", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["abc", "letters"],
    ["0112345678", "landline (011)"],
    ["+94112345678", "landline with country code"],
    ["077123456", "too short"],
    ["07712345678", "too long"],
    ["+9477123456", "too short with country code"],
    ["+947712345678", "too long with country code"],
    ["0094771234567", "00 international prefix"],
    ["+91771234567", "other country code"],
    ["(077) 123 4567", "brackets"],
    ["077.123.4567", "dots"],
    ["077123456a", "letter in number"],
    ["+94 077 123 4567", "country code plus leading 0"],
    ["٠٧٧١٢٣٤٥٦٧", "non-ASCII digits"],
  ])("rejects %j (%s)", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("isValidPhone", () => {
  it("is true for valid numbers and false otherwise", () => {
    expect(isValidPhone("077 123 4567")).toBe(true);
    expect(isValidPhone("011 234 5678")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("formats E.164 for display", () => {
    expect(formatPhone("+94771234567")).toBe("077 123 4567");
    expect(formatPhone("+94701234567")).toBe("070 123 4567");
  });

  it("returns anything that isn't E.164 unchanged", () => {
    expect(formatPhone("0771234567")).toBe("0771234567");
    expect(formatPhone("")).toBe("");
  });
});
