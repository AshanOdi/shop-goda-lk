import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Finds src/i18n/request.ts and wires it into every request.
const withNextIntl = createNextIntlPlugin();

// Adds Sentry: source map upload at build time and the /monitoring tunnel route.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "university-of-jaffna-bn",
  project: "javascript-nextjs",

  // Only print source map upload logs in CI.
  silent: !process.env.CI,

  // Upload more source maps so stack traces point at our original files.
  widenClientFileUpload: true,

  // Browser errors go to our own /monitoring route first, then Sentry,
  // so ad blockers don't drop them.
  tunnelRoute: "/monitoring",
});
