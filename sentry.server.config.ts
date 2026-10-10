// Starts Sentry for the Node.js server (pages, route handlers, server actions).
// Loaded by src/instrumentation.ts. Shared settings live in src/lib/sentry.ts.
import * as Sentry from "@sentry/nextjs";
import { sentryDsn, sentryOptions } from "@/lib/sentry";

if (sentryDsn) {
  Sentry.init(sentryOptions);
}
