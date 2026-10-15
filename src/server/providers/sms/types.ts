/**
 * The contract every SMS provider follows (CLAUDE.md: providers sit behind
 * interfaces). Code that sends SMS depends on this, never on Text.lk directly,
 * so the provider can be swapped, and tests and local development need no account.
 */

export type SmsMessage = {
  /** E.164, e.g. "+94771234567" (SPEC 5.2). */
  to: string;
  text: string;
};

/**
 * Sending can fail for ordinary reasons (no credit, network down), so the result
 * says so instead of throwing. `providerId` is the provider's message id.
 */
export type SmsResult = { ok: true; providerId?: string } | { ok: false; error: string };

export interface SmsProvider {
  /** Short name for logs, e.g. "console" or "textlk". */
  readonly name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}
