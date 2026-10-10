// Starts Sentry for edge features such as middleware.
// Loaded by src/instrumentation.ts. Shared settings live in src/lib/sentry.ts.
import * as Sentry from "@sentry/nextjs";
import { sentryDsn, sentryOptions } from "@/lib/sentry";

if (sentryDsn) {
  Sentry.init(sentryOptions);
}
