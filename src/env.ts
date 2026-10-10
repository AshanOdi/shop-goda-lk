/**
 * Environment variables, validated once at startup. SPEC 16: fail fast with a clear
 * message when a required one is missing. Import `env` instead of reading process.env.
 *
 * Only DATABASE_URL and BETTER_AUTH_SECRET are required; provider keys (email, SMS,
 * storage...) are optional because each provider falls back to a console/local
 * implementation in development when its keys are empty.
 */
import { z } from "zod";

const optionalString = z.string().optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "must be a postgres:// URL" }),
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  ENCRYPTION_KEY: z
    .base64()
    .refine((value) => Buffer.from(value, "base64").length === 32, "must decode to 32 bytes")
    .optional(),

  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  NEXT_PUBLIC_ASSETS_URL: z.url().optional(),

  RESEND_API_KEY: optionalString,
  EMAIL_FROM_DOMAIN: z.string().default("mail.apekade.lk"),

  TEXTLK_API_KEY: optionalString,
  TEXTLK_SENDER_ID: z.string().default("ApeKade"),

  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,

  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  SENTRY_DSN: z.url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: optionalString,

  PAYHERE_SANDBOX: z.stringbool().default(true),
  APEKADE_PAYHERE_MERCHANT_ID: optionalString,
  APEKADE_PAYHERE_MERCHANT_SECRET: optionalString,

  // OPEN QUESTION (SPEC 7.6): Pro plan price; placeholder Rs 1,990.
  PRO_PLAN_PRICE_CENTS: z.coerce.number().int().positive().default(199000),
  TRIAL_DAYS: z.coerce.number().int().positive().default(14),
});

export type Env = z.infer<typeof envSchema>;

/** Validates a set of variables. Exported for tests; the app uses `env` below. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // `KEY=` in a .env file arrives as "", which should count as "not set".
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = envSchema.safeParse(present);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables (see .env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const env = parseEnv(process.env);
