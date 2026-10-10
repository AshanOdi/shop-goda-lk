# 006 — Deploying to Vercel and Supabase, and error monitoring with Sentry

**Milestone:** M0 · **Branch:** m0/monitoring-deploy · **Commits:**
`chore: pin vercel functions to the mumbai region` ·
`feat: add sentry error monitoring with privacy scrubbing` ·
`docs: record deploy and monitoring decisions`

## What we built

Ape Kade is live on the internet: Vercel runs the app in Mumbai and talks to a Supabase Postgres database, also in Mumbai. Sentry now catches errors from real users' browsers and from our server, with buyer personal data removed before anything is sent.

## Why it matters

A shop builder that only runs on a laptop helps nobody. Every merged PR can now be opened on a phone at a real URL. And when something breaks for a buyer in Galle at 11 pm, Sentry tells us which file and line failed, without leaking that buyer's phone number or address.

## New concepts

### Serverless hosting (Vercel)

With Express you rent a server and keep `node server.js` running. On Vercel, each request runs our code as a short-lived **function** that starts, answers and stops. Vercel adds more copies automatically when traffic grows (**auto-scaling**), and there's no server to patch.

- **Deployment**: one built version of the app at a URL.
- **Preview deployment**: every PR gets its own URL, so you can test before merging.
- **Production deployment**: what `main` serves.
- `vercel.json` → `"regions": ["bom1"]` pins our functions to Mumbai (airport code BOM).

### Environments and environment variables in the cloud

| Environment | Where | Database | Env vars from |
| --- | --- | --- | --- |
| Development | your laptop | Docker Postgres | `.env.local` |
| Preview / Production | Vercel | Supabase `apekade-staging` | Vercel → Settings → Environment Variables |
| CI | GitHub Actions | Postgres service container | `env:` in `ci.yml` |

The same `src/env.ts` validates them everywhere. Only the source changes.

**`NEXT_PUBLIC_` prefix:** Next.js copies these variables into the JavaScript sent to browsers, so anyone can read them. Use it only for public values (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`). `DATABASE_URL` must never have it.

### Latency and regions

Data takes time to travel: Sri Lanka ↔ USA is about 250 ms, Sri Lanka ↔ Mumbai about 30–50 ms. A page that runs three database queries pays that distance three times if the function and the database are far apart. So the function (`bom1`) and the database (`ap-south-1`) both live in Mumbai.

### Connection pooling, transaction mode and IPv4

Postgres handles only a limited number of connections (our dashboard shows `0/60`). Hundreds of serverless functions connecting at once would exhaust that. Supabase's **pooler** (Supavisor, port **6543**) sits in between and shares a few real connections among many functions.

In **transaction mode**, a function borrows a connection for one transaction only, so Postgres **prepared statements** (which live on a connection) can't be used. That's why `src/server/db/index.ts` (note 003) has `prepare: false`.

The pooler also speaks **IPv4**. Supabase's direct connection is IPv6-only, which Vercel functions can't reach.

**Connection string anatomy:**

```
postgresql://postgres.<project-ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
└─protocol─┘ └────────user────────┘ └password┘ └──────────────host──────────────────┘ └port┘ └db───┘ └query: use SSL┘
```

`?sslmode=require` encrypts traffic between Vercel and Supabase (SSL/TLS).

### Attack surface: why we turned off Supabase's Data API

Supabase can expose tables as a public REST API used by `supabase-js` from browsers. We don't use that (CLAUDE.md forbids it): every request goes through our server, where `withShop()` tenancy, price recalculation and rate limits live. Leaving the Data API on would be a second door into the database that skips all of that. Fewer doors = smaller **attack surface**.

### Error monitoring (Sentry)

Sentry catches errors and sends them to a dashboard with the file, line, browser and how many users were affected.

- **DSN**: the address of our Sentry project. It's public by design.
- **Source maps**: production code is **minified** (`a.b(c)` on one long line). Source maps translate it back to `src/...:42`. They're uploaded during `next build` using the secret **`SENTRY_AUTH_TOKEN`**.
- **Tunnel** (`/monitoring`): browser error reports go to our own domain first, so ad blockers don't drop them.
- **Sampling** (`tracesSampleRate: 0.1`): send performance data for 10% of requests. Errors are always sent.
- **Instrumentation**: code that observes the app. Next.js has two hooks for it:
  - `src/instrumentation.ts` → `register()` runs once when a server starts; `onRequestError` reports server rendering/route errors.
  - `src/instrumentation-client.ts` runs in the browser before our app code.
- **`global-error.tsx`**: a special Next.js file shown when even the root layout crashes. It reports the error to Sentry and shows a fallback page.

### PII and data minimisation

**PII** (personally identifiable information) = name, phone, email, address, IP. The safest PII is the PII you never collect. That's **data minimisation**, and Sri Lanka's PDPA expects it. We apply it twice:

1. `dataCollection` tells Sentry not to collect user info, cookies, request bodies, query params, DB query data or stack variables.
2. `beforeSend: scrubEvent` runs on every error just before it's sent. It deletes `user` and the request body, and replaces emails and Sri Lankan mobile numbers in messages with `[email]` / `[phone]`.

## How it works

Buyer's browser throws an error → `instrumentation-client.ts` (Sentry started because `NEXT_PUBLIC_SENTRY_DSN` is set on Vercel) catches it → `scrubEvent()` removes PII → POST to `https://<our-site>/monitoring` (tunnel) → our server forwards it to Sentry → Sentry uses the uploaded source maps to show `src/...:line` → email alert to us.

Server-side: an error in a page or route handler → Next.js calls `onRequestError` in `src/instrumentation.ts` → same scrubbing → Sentry.

Locally: no `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` → `if (sentryDsn)` is false → Sentry never starts.

## Files changed

| File | What it does |
| --- | --- |
| `vercel.json` | Pins Vercel functions to `bom1` (Mumbai) |
| `src/lib/sentry.ts` | Shared Sentry options (DSN, environment, sampling, `dataCollection`, `beforeSend`) |
| `src/lib/sentry-scrub.ts` | `redactPII()` and `scrubEvent()` |
| `tests/unit/sentry-scrub.test.ts` | Proves phones/emails are redacted and user/body removed |
| `src/instrumentation.ts` | Server hook: loads the Node or edge Sentry config; reports request errors |
| `src/instrumentation-client.ts` | Starts Sentry in the browser |
| `sentry.server.config.ts`, `sentry.edge.config.ts` | Start Sentry in the Node.js and edge runtimes |
| `src/app/global-error.tsx` | Last-resort error page that reports to Sentry |
| `next.config.ts` | `withSentryConfig`: source maps + `/monitoring` tunnel |
| `src/env.ts`, `.env.example`, `docs/SPEC.md` | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

## Key code, explained

```ts
// Sri Lankan mobiles in any format we accept (SPEC 5.2): 07X..., 7X..., +947X..., 947X...
const SL_MOBILE = /(?<!\d)(?:\+94|94|0)?7\d(?:[\s-]?\d){7}(?!\d)/g;
```

- `(?<!\d)`: a **lookbehind**, "not preceded by a digit", so we don't match the middle of a longer number.
- `(?:\+94|94|0)?`: an optional prefix: `+94`, `94` or `0`. `(?: )` groups without capturing.
- `7\d`: a 7 then any digit (`77`, `71`, ...).
- `(?:[\s-]?\d){7}`: seven more digits, each optionally preceded by a space or dash (`077 123 4567`).
- `(?!\d)`: a **lookahead**, "not followed by a digit".
- `g`: replace every match, not just the first.

## Try it yourself

1. Open your Vercel URL on your phone, and `…/api/health`.
2. Vercel dashboard → your project → **Deployments**: click one to see its build log, the same output as `pnpm build`.
3. Open a PR and watch Vercel comment a **preview URL** on it.
4. In `tests/unit/sentry-scrub.test.ts`, add a row `["Call 076 555 1234 now", "Call [phone] now"]` and run `pnpm test`.

## Check your understanding

1. Why does `DATABASE_URL` use port 6543 on Vercel but 5432 locally?
2. Why must `DATABASE_URL` never be renamed to `NEXT_PUBLIC_DATABASE_URL`?
3. Name the two layers that keep buyer PII out of Sentry.

<details>
<summary>Answers</summary>

1. Vercel's many short-lived functions need Supabase's pooler (6543, IPv4, transaction mode). Locally one dev server talks straight to Docker Postgres (5432).
2. `NEXT_PUBLIC_` variables are copied into the browser bundle, so the database password would be public.
3. `dataCollection` (don't collect it) and `beforeSend: scrubEvent` (remove/redact anything that slipped through).

</details>

## Words to know

- **Serverless function**: code that runs per request on the host's infrastructure.
- **Preview deployment**: a temporary deployment of a PR.
- **Region / latency**: where code runs / how long data takes to travel.
- **Connection pooler**: shares a few database connections among many clients.
- **Prepared statement**: a query plan stored on one database connection.
- **SSL/TLS**: encryption for data in transit.
- **Attack surface**: all the ways an attacker could reach a system.
- **DSN**: where an app sends its Sentry events.
- **Source map**: maps minified code back to the original source.
- **PII / data minimisation**: personal data / collecting only what you need.
