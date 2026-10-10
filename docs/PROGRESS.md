# Progress

## Current milestone

M0 — Foundation (all tasks done; closes when PR for task 6 is merged and CI is green)

### M0 plan

Split into small tasks, one branch each:

1. `m0/project-setup` — git repo, Next.js scaffold (TypeScript, Tailwind, App Router, `src/`), Prettier, base scripts.
2. `m0/lib-money-phone` — Vitest, `src/lib/money.ts` and `src/lib/phone.ts` with full unit tests.
3. `m0/database` — Docker Compose Postgres, Drizzle + drizzle-kit, `src/env.ts` (zod-validated env), `.env.example`.
4. `m0/ui-foundation` — shadcn/ui, brand design tokens (SPEC 11), Inter font, base layout, next-intl scaffold.
5. `m0/testing-ci` — Playwright (390 × 844), `pnpm check`, GitHub Actions.
6. `m0/monitoring-deploy` — Sentry, Vercel project with preview deploys and staging.

Acceptance: `pnpm dev` runs; CI green; staging URL live.

## Done

- M0 task 1 `m0/project-setup`: Next.js 16 scaffold, Prettier, `pnpm check` (PR #1).
- M0 task 2 `m0/lib-money-phone`: Vitest, `money.ts`, `phone.ts`, 80 unit tests (committed straight to `main`).
- M0 task 3 `m0/database`: Docker Postgres, Drizzle client, `env.ts`, `/api/health` (PR #2).
- M0 task 4 `m0/ui-foundation`: shadcn/ui, Ape Kade brand tokens, Inter, next-intl, placeholder home page; renamed the project from the reference product (Sidadiya) to Ape Kade (PR #3).
- M0 task 5 `m0/testing-ci`: Playwright (390 × 844), GitHub Actions CI, `main` branch protection (PR #4).
- M0 task 6 `m0/monitoring-deploy`: Vercel (`bom1`) + Supabase staging (Mumbai) live with `/api/health` ok; Sentry with privacy scrubbing.

## Waiting on founders

See docs/SPEC.md section 17. Placeholders in use:

- Domain `apekade.lk` (`NEXT_PUBLIC_APP_URL`, `EMAIL_FROM_DOMAIN`): availability not checked.
- Brand colours and logo (SPEC 11): placeholder maroon/orange tokens, text-only logo.
- Pro plan price: `PRO_PLAN_PRICE_CENTS=199000`.
