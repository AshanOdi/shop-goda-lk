import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

const required = {
  DATABASE_URL: "postgres://apekade:apekade@localhost:5432/apekade",
  BETTER_AUTH_SECRET: "a".repeat(32),
};

describe("parseEnv", () => {
  it("works with only the two required variables and fills in defaults", () => {
    const env = parseEnv(required);
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.PAYHERE_SANDBOX).toBe(true);
    expect(env.PRO_PLAN_PRICE_CENTS).toBe(199000);
    expect(env.TRIAL_DAYS).toBe(14);
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it("fails fast when a required variable is missing", () => {
    expect(() => parseEnv({ BETTER_AUTH_SECRET: required.BETTER_AUTH_SECRET })).toThrow(
      /DATABASE_URL/,
    );
    expect(() => parseEnv({ DATABASE_URL: required.DATABASE_URL })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("treats empty values from .env files as not set", () => {
    expect(() => parseEnv({ ...required, BETTER_AUTH_SECRET: "" })).toThrow(/BETTER_AUTH_SECRET/);
    expect(parseEnv({ ...required, RESEND_API_KEY: "" }).RESEND_API_KEY).toBeUndefined();
  });

  it("rejects a non-postgres database URL and a short secret", () => {
    expect(() => parseEnv({ ...required, DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /DATABASE_URL/,
    );
    expect(() => parseEnv({ ...required, BETTER_AUTH_SECRET: "short" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it("converts numbers and booleans from text", () => {
    const env = parseEnv({
      ...required,
      PRO_PLAN_PRICE_CENTS: "250000",
      TRIAL_DAYS: "30",
      PAYHERE_SANDBOX: "false",
    });
    expect(env.PRO_PLAN_PRICE_CENTS).toBe(250000);
    expect(env.TRIAL_DAYS).toBe(30);
    expect(env.PAYHERE_SANDBOX).toBe(false);
  });

  it("requires ENCRYPTION_KEY to be 32 bytes when set", () => {
    const key = Buffer.alloc(32, 1).toString("base64");
    expect(parseEnv({ ...required, ENCRYPTION_KEY: key }).ENCRYPTION_KEY).toBe(key);
    const shortKey = Buffer.alloc(16, 1).toString("base64");
    expect(() => parseEnv({ ...required, ENCRYPTION_KEY: shortKey })).toThrow(/ENCRYPTION_KEY/);
  });
});
