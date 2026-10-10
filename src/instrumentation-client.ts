// Starts Sentry in the browser. Next.js runs this file before the app's own code.
// Shared settings live in src/lib/sentry.ts.
import * as Sentry from "@sentry/nextjs";
import { sentryDsn, sentryOptions } from "@/lib/sentry";

if (sentryDsn) {
  Sentry.init(sentryOptions);
}

// Records client-side navigations as performance traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
