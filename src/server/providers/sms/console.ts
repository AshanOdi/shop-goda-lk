/**
 * Development and test SMS provider: prints the message instead of sending it,
 * so OTP codes appear in the terminal running `pnpm dev`. Also keeps every message
 * in `sent`, so tests can check what would have gone out.
 */
import { maskPhone } from "@/lib/phone";
import type { SmsMessage, SmsProvider, SmsResult } from "./types";

export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  readonly sent: SmsMessage[] = [];

  async send(message: SmsMessage): Promise<SmsResult> {
    this.sent.push(message);
    // The number is masked even in development (CLAUDE.md: never log phone numbers).
    console.info(`[sms:console] to ${maskPhone(message.to)}: ${message.text}`);
    return { ok: true, providerId: `console-${this.sent.length}` };
  }
}
