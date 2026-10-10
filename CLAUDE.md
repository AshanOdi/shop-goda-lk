# CLAUDE.md — Ape Kade

Ape Kade is a multi-tenant shop builder for small Sri Lankan sellers who sell on Facebook, Instagram, TikTok and WhatsApp. The full spec is in `docs/SPEC.md`. Read it before starting any work, and re-read the relevant section before each milestone.

## The one rule

The money path must be perfect: a buyer can always place an order, no order is ever lost, totals are always right, and payment status is never wrong. When in doubt, choose correctness over speed or polish.

## How to work

1. Build milestone by milestone (SPEC section 14). Do not start the next milestone until the current one meets its acceptance criteria.
2. Before each milestone: write a short plan in `docs/PROGRESS.md`. After it: run `pnpm check`, update `docs/PROGRESS.md`, commit.
3. Small, focused commits with clear messages. Never commit secrets.
4. When the spec is silent, pick the simplest option that keeps the money path correct and log it in `docs/DECISIONS.md` (date, decision, reason).
5. Items marked OPEN QUESTION: use the placeholder from the spec behind a config value and list it under "Waiting on founders" in `docs/PROGRESS.md`. Don't block on them.
6. Check current library docs before using an API you are unsure of. Don't guess at PayHere, Better Auth, Inngest or Drizzle APIs.

## Stack (decided — do not substitute)

TypeScript (strict) · pnpm · Next.js App Router · Tailwind + shadcn/ui · react-hook-form + zod · PostgreSQL (Supabase, plain Postgres only) · Drizzle ORM · Better Auth (phone OTP) · Inngest · Upstash Redis · Cloudflare R2 · @react-pdf/renderer · Resend + React Email · Text.lk SMS · PayHere · next-intl · Sentry · PostHog · Vitest · Playwright · GitHub Actions · Vercel (region bom1).

Not allowed: Supabase Auth or Supabase client SDK for data, Prisma, Redux, CSS-in-JS.

## Non-negotiable code rules

- **Money** is integer cents (`*_cents`), LKR only, all math through `src/lib/money.ts`. No floats.
- **Phones** stored as E.164 (`+947XXXXXXXX`) via `src/lib/phone.ts`.
- **Tenancy:** every tenant table has `shop_id`; every tenant query goes through `withShop(shopId)` in `src/server/db/tenant.ts`; Postgres RLS is enabled as a second guard. Services take `shopId` as the first argument.
- **Prices** are always recalculated on the server from the DB. Never trust client totals.
- **Order placement** is one transaction (SPEC 7.5). Emails, PDFs, SMS and analytics run in Inngest jobs after commit and must never break checkout.
- **Order status** changes only through `orders.transition()` following the state machine in SPEC 7.1.
- **Card payment status** is set only by a verified PayHere webhook, never by the browser return URL. Webhooks are idempotent.
- **Public links** (tracking, receipt) use random `public_token`s, never order numbers or IDs.
- UI never imports `src/server/db`; it calls `src/server/services`.
- External providers (payments, SMS, email, couriers, storage) sit behind interfaces in `src/server/providers/*/types.ts`, each with a console/local implementation for development and tests.
- Every user-facing string goes through next-intl.
- Never log buyer phone numbers, addresses or emails. Tag Sentry events with `shopId`/`orderId` only.

## Design rules

- Mobile-first at 375 px. Buyer pages must work in the Facebook and WhatsApp in-app browsers.
- Ape Kade's look is defined by the brand tokens in SPEC section 11 (maroon and orange). `docs/brand/` holds another product's ads: use them only to see which screens and sections exist, never copy their name, colours, slogans or style.
- Every screen handles loading, empty and error states. Tap targets at least 44 px.

## Commands

- `pnpm dev` — run locally (works with only `DATABASE_URL` and `BETTER_AUTH_SECRET` set)
- `pnpm check` — typecheck + lint + unit and integration tests (must pass before every commit)
- `pnpm test:e2e` — Playwright end-to-end tests
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle migrations
- `pnpm db:seed` — seed the demo shop "ABC Fashion"
- `docker compose up -d` — local Postgres (and anything else local dev needs)

Create these scripts in M0 if they don't exist.

## Definition of done

Works on a phone viewport · logic covered by tests · loading/empty/error states handled · i18n keys used · no TypeScript or lint errors · `docs/PROGRESS.md` updated.

## Next.js version notes

@AGENTS.md
