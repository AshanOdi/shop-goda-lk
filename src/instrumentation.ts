// Next.js calls register() once when a server instance starts.
// NEXT_RUNTIME tells us which runtime we're in, so each loads its own Sentry config.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Reports errors thrown while rendering pages or running route handlers and server actions.
export const onRequestError = Sentry.captureRequestError;
