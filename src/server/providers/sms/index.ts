/**
 * Picks the SMS provider. With TEXTLK_API_KEY set, messages really go out via
 * Text.lk; without it they're printed to the terminal (SPEC 16: `pnpm dev` works
 * with only DATABASE_URL and BETTER_AUTH_SECRET).
 */
import { env } from "@/env";
import { ConsoleSmsProvider } from "./console";
import { TextLkSmsProvider } from "./textlk";
import type { SmsProvider } from "./types";

export type { SmsMessage, SmsProvider, SmsResult } from "./types";

type SmsConfig = {
  TEXTLK_API_KEY?: string;
  TEXTLK_SENDER_ID: string;
  NODE_ENV: "development" | "test" | "production";
};

/** Pure function of the config, so it can be tested without touching process.env. */
export function createSmsProvider(config: SmsConfig): SmsProvider {
  if (config.TEXTLK_API_KEY) {
    return new TextLkSmsProvider({
      apiKey: config.TEXTLK_API_KEY,
      senderId: config.TEXTLK_SENDER_ID,
    });
  }
  if (config.NODE_ENV === "production") {
    // Allowed so staging works without an SMS account, but must be loud:
    // in production nobody reads the terminal, so OTPs would never arrive.
    console.warn("[sms] TEXTLK_API_KEY is not set: SMS will be printed, not sent.");
  }
  return new ConsoleSmsProvider();
}

let provider: SmsProvider | undefined;

/** The app-wide provider, created on first use. */
export function getSmsProvider(): SmsProvider {
  provider ??= createSmsProvider(env);
  return provider;
}
