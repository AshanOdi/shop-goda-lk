# Progress

## Current milestone

M1 — Auth, shops, tenancy (in progress)

### M1 plan

Acceptance (SPEC 14): a new seller reaches an empty dashboard with a live (empty) store URL; tenant isolation tests pass.

1. `m1/accounts-schema`: Drizzle schema for Better Auth tables (`user`, `session`, `account`, `verification`) plus `shops`, `shop_members`, `shop_counters`, `subscriptions` (SPEC 6.1); UUID v7 ids; first migration; `db:migrate` in CI.
2. `m1/tenancy-rls`: non-superuser app database role, `withShop(shopId)` in `src/server/db/tenant.ts` using `set_config('app.shop_id', ..., true)`, RLS policies, integration-test setup on real Postgres, tenant isolation tests (SPEC 5.6).
3. `m1/sms-provider`: `src/server/providers/sms/types.ts` with a console adapter (dev/tests) and a Text.lk adapter.
4. `m1/phone-otp-auth`: Better Auth phone OTP (6 digits, 5-minute expiry, 5 attempts, resend after 60 s), `/signup` and `/login` pages, session helpers (SPEC 8.8).
5. `m1/onboarding`: `/dashboard/setup`: shop name, slug with live availability check and reserved words, WhatsApp, payment methods and bank details, default delivery option; shop + owner membership + order counter + 14-day trial created in one transaction (SPEC 8.9, 7.6).
6. `m1/dashboard-shell`: empty seller dashboard with bottom tab bar, and an empty public store page at `/store/[slug]`.

## Done

### M1 — Auth, shops, tenancy (in progress)

- M1 task 1 `m1/accounts-schema`: users/sessions/accounts/verifications, shops, shop_members, shop_counters, subscriptions; first migration; CI migrates (PR #9).
- M1 task 2 `m1/tenancy-rls`: `apekade_app` role, RLS policies, `withShop()`, 13 integration tests incl. an RLS coverage guard.
- `m1/home-redesign`: adopted the v0 home page design after review (i18n, contrast, tap targets); SPEC 11 palette updated.
- M1 task 3 `m1/sms-provider`: `SmsProvider` interface, console and Text.lk adapters, provider selection, 13 unit tests.

### M0 — Foundation ✅ (2026-10-10)

Acceptance met: `pnpm dev` runs; CI green; staging URL live (Vercel `bom1` + Supabase Mumbai); Sentry receiving errors.

- M0 task 1 `m0/project-setup`: Next.js 16 scaffold, Prettier, `pnpm check` (PR #1).
- M0 task 2 `m0/lib-money-phone`: Vitest, `money.ts`, `phone.ts`, 80 unit tests (committed straight to `main`).
- M0 task 3 `m0/database`: Docker Postgres, Drizzle client, `env.ts`, `/api/health` (PR #2).
- M0 task 4 `m0/ui-foundation`: shadcn/ui, Ape Kade brand tokens, Inter, next-intl, placeholder home page; renamed the project from the reference product (Sidadiya) to Ape Kade (PR #3).
- M0 task 5 `m0/testing-ci`: Playwright (390 × 844), GitHub Actions CI, `main` branch protection (PR #4).
- M0 task 6 `m0/monitoring-deploy`: Vercel (`bom1`) + Supabase staging (Mumbai) live with `/api/health` ok; Sentry with privacy scrubbing (PR #5).

## Waiting on founders

See docs/SPEC.md section 17. Placeholders in use:

- Domain `apekade.lk` (`NEXT_PUBLIC_APP_URL`, `EMAIL_FROM_DOMAIN`): availability not checked.
- Brand colours and logo (SPEC 11): placeholder maroon/orange tokens, text-only logo.
- Pro plan price: `PRO_PLAN_PRICE_CENTS=199000`.
- Text.lk account and sender ID `ApeKade` (`TEXTLK_API_KEY`, `TEXTLK_SENDER_ID`): needed before real OTPs can be sent; until then OTPs are printed in the server log.
