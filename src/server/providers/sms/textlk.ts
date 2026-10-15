/**
 * Text.lk SMS provider (SPEC 3). API: POST https://app.text.lk/api/v3/sms/send
 * with a Bearer token; checked against https://text.lk/docs/send-sms/ (2026-10-15).
 */
import { isE164Mobile } from "@/lib/phone";
import type { SmsMessage, SmsProvider, SmsResult } from "./types";

export const TEXTLK_SEND_URL = "https://app.text.lk/api/v3/sms/send";

type TextLkOptions = {
  apiKey: string;
  /** Alphanumeric, at most 11 characters (Text.lk rule), e.g. "ApeKade". */
  senderId: string;
  /** Injected in tests; defaults to the global fetch. */
  fetch?: typeof fetch;
  timeoutMs?: number;
};

// The docs' example shows `uid` at the top level; accept it inside `data` as well.
type TextLkResponse = { status?: string; message?: string; uid?: string; data?: { uid?: string } };

export class TextLkSmsProvider implements SmsProvider {
  readonly name = "textlk";
  private readonly fetch: typeof fetch;

  constructor(private readonly options: TextLkOptions) {
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    if (!isE164Mobile(message.to)) {
      return { ok: false, error: "Recipient is not a Sri Lankan mobile number in E.164 form" };
    }

    let response: Response;
    try {
      response = await this.fetch(TEXTLK_SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipient: message.to.slice(1), // Text.lk wants 94771234567, without "+"
          sender_id: this.options.senderId,
          type: "plain",
          message: message.text,
        }),
        // Don't let a slow SMS gateway hang a request forever.
        signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
      });
    } catch (error) {
      return { ok: false, error: `Text.lk request failed: ${(error as Error).name}` };
    }

    let body: TextLkResponse;
    try {
      body = (await response.json()) as TextLkResponse;
    } catch {
      return { ok: false, error: `Text.lk returned HTTP ${response.status} without JSON` };
    }

    if (response.ok && body.status === "success") {
      return { ok: true, providerId: body.data?.uid ?? body.uid };
    }
    return {
      ok: false,
      error: `Text.lk error (HTTP ${response.status}): ${body.message ?? "unknown error"}`,
    };
  }
}
