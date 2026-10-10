/**
 * Sentry settings shared by the browser, Node.js and edge configs.
 *
 * Reads process.env directly instead of importing src/env.ts, because this file is
 * also bundled into the browser, where server-only variables don't exist.
 * NEXT_PUBLIC_* values are inlined into the bundle at build time.
 */
import { scrubEvent } from "./sentry-scrub";

// No DSN (local development, tests) → Sentry is not started at all.
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const sentryOptions = {
  dsn: sentryDsn,
  // Vercel sets this to "production" or "preview"; locally it's undefined.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  // Send performance data for 10% of requests; errors are always sent.
  tracesSampleRate: 0.1,
  // Privacy (CLAUDE.md, Sri Lanka PDPA): collect nothing that identifies a buyer.
  dataCollection: {
    userInfo: false, // no user id, email or IP address
    cookies: false,
    httpBodies: [], // checkout requests contain name, phone and address
    httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    urlQueryParams: false,
    databaseQueryData: false, // query parameters can contain phone numbers
    stackFrameVariables: false, // local variables can hold buyer details
  },
  beforeSend: scrubEvent,
};
