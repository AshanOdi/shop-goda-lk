# Sidadiya — Product and Engineering Spec (v1)

> Audience: Claude Code and the engineering team.
> Purpose: everything needed to build Sidadiya from an empty repo to a production launch.
> Rule: when this spec and your own preference disagree, follow the spec. When the spec is silent or ambiguous, choose the simplest option that keeps the money path correct, and write the decision into `docs/DECISIONS.md`.

---

## 0. How to use this document

1. Work milestone by milestone (section 14). Do not start a milestone until the previous one meets its acceptance criteria.
2. At the start of each milestone, write a short plan, then build, then run all checks (`pnpm check`), then update `docs/PROGRESS.md`.
3. Anything marked **OPEN QUESTION** needs a human answer. Use a sensible placeholder behind a config value, and list it in `docs/PROGRESS.md` under "Waiting on founders".
4. The marketing ads in `docs/brand/` show the intended look of the storefront, checkout, dashboard, receipt, waybill, tracking page and reports. Match their layout and tone.

---

## 1. Product summary

Sidadiya (sidadiya.com) is a multi-tenant online shop builder for small Sri Lankan sellers who currently take orders through Facebook, Instagram, TikTok and WhatsApp messages.

Each seller gets:

- A store at `sidadiya.com/store/{slug}` where buyers order 24/7.
- A checkout that captures name, phone, address, delivery option and payment method (cash on delivery, bank transfer, card).
- A mobile-first back office to manage products and orders.
- Automatic order emails, a live tracking page, digital receipts and printable A6 waybills with a COD amount and QR code.
- (Phase 2) Card payments, coupons, traffic-source and town reports, weekly summary emails, reviews.

Business model: 14-day free trial, no card needed, then a paid monthly Pro plan.

**Target seller:** 1–2 person clothing, cosmetics or gift business, works almost entirely on a mid-range Android phone, not technical.
**Target buyer:** arrives from a social media link on a phone, often inside the Facebook or WhatsApp in-app browser, on mobile data.

### The one rule

The money path must be perfect: a buyer can always place an order, the order is never lost, totals are always right, and payment status is never wrong. Everything else may ship simpler and improve later.

---

## 2. Scope by phase

| Feature | Phase |
| --- | --- |
| Seller sign-up (phone OTP), create shop, slug, logo, WhatsApp, bank details, delivery fees | 1 (MVP) |
| Products with variants (size, colour), stock, images, sale price | 1 |
| Public storefront: shop header, search, filters (All / On sale / New arrivals), product page, cart | 1 |
| Checkout: contact → delivery → payment → review → place order | 1 |
| Payment methods: COD, bank transfer (slip upload, manual approval) | 1 |
| Seller order management: list, filters, order page, status changes, tracking number | 1 |
| Order emails to buyer: placed, confirmed, shipped, delivered | 1 |
| New-order notification to seller (email + in-app) | 1 |
| Public tracking page with progress timeline | 1 |
| Digital receipt page + PDF + WhatsApp share | 1 |
| A6 waybill PDF with COD amount and QR code; batch print | 1 |
| Trial (14 days) and Pro subscription billing, store pause when unpaid | 1 |
| Shop readiness checklist (refund, privacy, return, terms pages, contact details) | 2 |
| Card payments via PayHere (per-shop merchant account) | 2 |
| Coupons | 2 |
| Traffic sources and town reports; UTM link builder | 2 |
| Weekly sales summary email (Mondays) | 2 |
| Buyer "I received it" confirmation and reviews | 2 |
| Courier API sync (Koombiyo, Colombo City Express) | 3 |
| SMS order notifications (Text.lk) | 3 |
| WhatsApp Business Cloud API messages | 3 |
| Sinhala and Tamil translations of storefront and emails | 3 (i18n plumbing in Phase 1) |
| Staff accounts with roles | 3 |

Build Phase 1 completely before starting Phase 2.

---

## 3. Tech stack (decided — do not substitute)

| Layer | Choice |
| --- | --- |
| Language | TypeScript, `strict: true`, no `any` without a comment explaining why |
| Package manager | pnpm |
| Framework | Next.js (App Router, latest stable), React Server Components by default |
| UI | Tailwind CSS + shadcn/ui; icons from lucide-react |
| Forms and validation | react-hook-form + zod (zod schemas shared between client and server) |
| Database | PostgreSQL on Supabase (Mumbai region) — used as plain Postgres only |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Auth | Better Auth (phone OTP + email magic link), sessions in our Postgres |
| Background jobs | Inngest |
| Rate limiting | Upstash Redis + @upstash/ratelimit |
| File storage | Cloudflare R2 (S3 API) via @aws-sdk/client-s3; images resized before upload |
| PDFs | @react-pdf/renderer |
| QR codes | qrcode |
| Email | Resend + React Email |
| SMS | Text.lk REST API |
| Payments | PayHere |
| i18n | next-intl (English only in Phase 1, keys for every string) |
| Errors | Sentry (@sentry/nextjs) |
| Analytics | PostHog (product analytics), own `visits` table for seller reports |
| Tests | Vitest (unit + integration), Playwright (end-to-end, phone viewport) |
| Lint / format | ESLint + Prettier |
| CI/CD | GitHub Actions + Vercel (preview per PR, staging, production) |
| Hosting | Vercel Pro, functions region `bom1` (Mumbai) |

Do not use Supabase Auth, the Supabase client SDK for data access, Prisma, Redux, or any CSS-in-JS library.

Check the current docs of each library before using its API; record version-specific decisions in `docs/DECISIONS.md`.

---

## 4. Repository structure

```
sidadiya/
  CLAUDE.md
  docs/
    SPEC.md              ← this file
    DECISIONS.md         ← decisions made during build (date, decision, reason)
    PROGRESS.md          ← milestone status, waiting-on-founders list
    brand/               ← marketing ads (visual reference)
  src/
    app/
      (marketing)/       ← sidadiya.com landing, pricing, legal
      (auth)/            ← sign-in, sign-up, OTP
      (seller)/dashboard/← seller back office (requires session + shop)
      admin/             ← platform admin (Sidadiya team only)
      store/[slug]/      ← public storefront, product, cart, checkout
      o/[token]/         ← public order tracking page
      r/[token]/         ← public receipt page
      api/
        inngest/         ← Inngest handler
        webhooks/payhere/← PayHere notify_url
        auth/[...all]/   ← Better Auth
        track/           ← visit beacon
    components/
      ui/                ← shadcn components
      store/             ← storefront components
      seller/            ← dashboard components
    server/
      db/
        schema/          ← Drizzle schema, one file per domain
        index.ts         ← db client
        tenant.ts        ← withShop(shopId) helper — the ONLY way to query tenant tables
      services/          ← business logic (orders, pricing, payments, shipping...)
      providers/         ← adapters: payments/, sms/, email/, couriers/, storage/
      jobs/              ← Inngest functions
      auth.ts
    lib/                 ← pure helpers (money, phone, dates, slugs)
    emails/              ← React Email templates
    pdf/                 ← react-pdf documents (receipt, waybill)
    i18n/
    env.ts               ← zod-validated environment
  tests/
    unit/
    integration/
    e2e/
  drizzle/               ← generated migrations (committed)
```

Rules:
- UI components never import from `server/db` directly. Pages and server actions call `server/services/*`.
- Every service function that touches tenant data takes `shopId` as its first argument.
- Provider adapters implement an interface in `server/providers/*/types.ts` so implementations can be swapped and mocked in tests. Each has a `console` implementation for local development.

---

## 5. Core conventions

### 5.1 Money
- Currency is LKR only in v1.
- Store all amounts as **integers in cents** (columns named `*_cents`). Rs 5,050.00 → `505000`.
- All calculations go through `src/lib/money.ts`. Never use floating-point arithmetic for money.
- Display format: `Rs 5,050` (no decimals when `.00`), `Rs 5,050.50` otherwise.

### 5.2 Phone numbers
- Accept `07XXXXXXXX`, `7XXXXXXXX`, `+947XXXXXXXX`, `947XXXXXXXX`, with spaces or dashes.
- Store in E.164: `+947XXXXXXXX`. Validate Sri Lankan mobile prefix `7` + 8 digits.
- Display as `077 123 4567`.
- Implement in `src/lib/phone.ts` with unit tests for every accepted and rejected format.

### 5.3 Addresses
- Fields: `line1` (required), `line2`, `city` (required, free text), `district` (required, select).
- Districts (25): Ampara, Anuradhapura, Badulla, Batticaloa, Colombo, Galle, Gampaha, Hambantota, Jaffna, Kalutara, Kandy, Kegalle, Kilinochchi, Kurunegala, Mannar, Matale, Matara, Monaragala, Mullaitivu, Nuwara Eliya, Polonnaruwa, Puttalam, Ratnapura, Trincomalee, Vavuniya.
- `city` normalised (trimmed, title case) for the town report.

### 5.4 IDs, tokens and numbers
- Primary keys: UUID v7 (time-ordered).
- Public links (tracking, receipt) use a 32-character random URL-safe `public_token`, never the order number or ID.
- Order numbers: `ORD-` + per-shop sequence starting at 10001. Generated inside the order transaction using a locked counter row in `shop_counters`.

### 5.5 Time
- Store `timestamptz` in UTC. Display in `Asia/Colombo`. Format dates as `28 Sept 2026`, times as `13:34`.

### 5.6 Tenancy (critical)
- Every tenant table has `shop_id uuid not null` with an index.
- All tenant queries go through `withShop(shopId)` in `server/db/tenant.ts`, which applies the `shop_id` filter.
- Additionally enable Postgres row-level security on tenant tables, with policies using `current_setting('app.shop_id')`, set per transaction with `set_config(..., true)`. The app's DB role must not bypass RLS. Public storefront reads use the same mechanism with the shop resolved from the slug.
- Integration tests must prove that shop A cannot read or write shop B's products, orders, customers or files.

### 5.7 Errors and logging
- Services throw typed errors (`AppError` with `code`); route handlers and server actions map them to user-safe messages.
- Never show stack traces to users. Log to Sentry with `shopId` and `orderId` tags, never with buyer phone or address.

---

## 6. Data model

All tables have `id uuid pk`, `created_at timestamptz default now()`, `updated_at timestamptz`. Tenant tables also have `shop_id`. Use Drizzle; enums as Postgres enums.

### 6.1 Accounts and shops

**users** — `name`, `phone` (unique, E.164), `email` (unique, nullable), `phone_verified_at`, `email_verified_at`, `is_platform_admin` bool
(Better Auth also creates its own `session`, `account`, `verification` tables — follow its Drizzle adapter.)

**shops** — `owner_id → users`, `slug` (unique, 3–30 chars, `[a-z0-9-]`, reserved words blocked), `name`, `tagline`, `logo_url`, `cover_url`, `whatsapp` (E.164), `email`, `address_line1`, `city`, `district`, `brand_color` (hex), `status` enum(`active`, `paused`, `suspended`), `bank_details` jsonb (`bank`, `branch`, `account_name`, `account_number`), `accepts_cod` bool, `accepts_bank_transfer` bool, `accepts_card` bool, `payhere_merchant_id`, `payhere_secret_encrypted`, `receipt_footer`, `onboarding_completed_at`

Reserved slugs: `admin, api, app, dashboard, store, o, r, login, signup, help, support, www, sidadiya, about, pricing, terms, privacy`.

**shop_members** — `shop_id`, `user_id`, `role` enum(`owner`, `staff`) (Phase 1: owner only)

**shop_counters** — `shop_id` pk, `next_order_number` int

**subscriptions** — `shop_id` unique, `plan` enum(`trial`, `pro`), `status` enum(`trialing`, `active`, `past_due`, `paused`, `cancelled`), `trial_ends_at`, `current_period_end`, `payhere_subscription_id`

**shop_pages** — `shop_id`, `kind` enum(`refund`, `privacy`, `return`, `terms`), `body` text (markdown), `published` bool. Unique (`shop_id`, `kind`).

**delivery_options** — `shop_id`, `name` (e.g. "Islandwide delivery", "Colombo same day"), `fee_cents`, `districts` text[] (empty = all), `free_over_cents` nullable, `position`, `active`

### 6.2 Catalogue

**products** — `shop_id`, `name`, `slug` (unique per shop), `description` (plain text, max 5,000), `status` enum(`draft`, `active`, `archived`), `price_cents`, `compare_at_price_cents` nullable (shows SALE when > price), `tags` text[], `position`. "New arrival" = created within the last 14 days.

**product_variants** — `shop_id`, `product_id`, `option1_name` ("Size"), `option1_value` ("M"), `option2_name` ("Colour"), `option2_value` ("Teal"), `price_cents` nullable (falls back to product), `stock` int nullable (null = untracked), `sku`, `position`
Every product has at least one variant (a default variant when there are no options).

**product_images** — `shop_id`, `product_id`, `url`, `width`, `height`, `position`

### 6.3 Customers and orders

**customers** — `shop_id`, `name`, `phone`, `email` nullable, `blocked` bool, `order_count`, `total_spent_cents`. Unique (`shop_id`, `phone`).

**orders**
- `shop_id`, `number` (text, unique per shop), `public_token` (unique), `customer_id`
- Snapshot of buyer at order time: `buyer_name`, `buyer_phone`, `buyer_email`, `ship_line1`, `ship_line2`, `ship_city`, `ship_district`
- `delivery_option_name`, `delivery_fee_cents`
- `subtotal_cents`, `discount_cents`, `total_cents`
- `coupon_code` nullable
- `payment_method` enum(`cod`, `bank_transfer`, `card`)
- `payment_status` enum(`unpaid`, `awaiting_verification`, `paid`, `failed`, `refunded`)
- `status` enum(`pending_payment`, `placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`)
- `buyer_note` (max 500), `seller_note`
- `source` (`whatsapp`, `facebook`, `instagram`, `tiktok`, `google`, `direct`, `other`), `utm` jsonb
- `idempotency_key` (unique per shop) — generated by the checkout form to prevent double submits
- `placed_at`, `confirmed_at`, `shipped_at`, `delivered_at`, `cancelled_at`

**order_items** — `shop_id`, `order_id`, `product_id`, `variant_id`, `name_snapshot` ("Silk Scarf"), `variant_snapshot` ("Colour: Teal"), `unit_price_cents`, `quantity`, `line_total_cents`, `image_url_snapshot`

**order_events** — `shop_id`, `order_id`, `type` (status names + `payment_received`, `note_added`, `email_sent`, `tracking_added`), `actor` enum(`buyer`, `seller`, `system`), `meta` jsonb, `at`

**shipments** — `shop_id`, `order_id` unique, `courier` enum(`domex`, `koombiyo`, `ccexpress`, `prompt_xpress`, `pronto`, `slpost`, `other`), `courier_other_name`, `tracking_number`, `tracking_url`, `cod_amount_cents`, `waybill_printed_at`

**payments** — `shop_id`, `order_id`, `method`, `amount_cents`, `status` enum(`pending`, `succeeded`, `failed`, `refunded`), `gateway` (`payhere`), `gateway_payment_id` (unique when set), `raw` jsonb, `slip_url` (bank transfer), `verified_by` user, `verified_at`, `rejection_reason`

### 6.4 Growth (Phase 2)

**coupons** — `shop_id`, `code` (uppercase, unique per shop), `type` enum(`percent`, `fixed`, `free_delivery`), `value` int, `min_subtotal_cents`, `max_uses`, `used_count`, `starts_at`, `ends_at`, `active`

**reviews** — `shop_id`, `order_id` unique, `product_id` nullable, `rating` 1–5, `body` (max 1,000), `buyer_name_display` ("Kasun S."), `status` enum(`published`, `hidden`)

**visits** — `shop_id`, `session_id`, `source`, `utm` jsonb, `landing_path`, `referrer_host`, `device` (`mobile`/`desktop`), `at`. No IP stored.

### 6.5 Platform

**audit_log** — `shop_id` nullable, `user_id`, `action`, `entity`, `entity_id`, `meta`, `at`
**email_log** — `shop_id`, `order_id` nullable, `to`, `template`, `provider_id`, `status`, `at`

---

## 7. Business rules

### 7.1 Order status machine

```
pending_payment ─(card paid)──────────► placed
placed ──► confirmed ──► packed ──► shipped ──► delivered
placed | confirmed | packed ──► cancelled
shipped | delivered ──► returned
pending_payment ──(card failed or abandoned 60 min)──► cancelled
```

- COD and bank-transfer orders start at `placed`. Card orders start at `pending_payment` and move to `placed` only after a verified PayHere callback.
- Any other transition is rejected by `orders.transition()` with an `INVALID_TRANSITION` error.
- `shipped` requires a shipment with courier set (tracking number optional but strongly prompted).
- Each transition writes an `order_events` row and emits the matching Inngest event.
- Cancelling restores stock for tracked variants.

### 7.2 Payment status
- COD: `unpaid` until seller marks "Cash received" (allowed from `shipped` or `delivered`) → `paid`.
- Bank transfer: `unpaid` → buyer uploads slip → `awaiting_verification` → seller approves → `paid`, or rejects → `unpaid` with a reason emailed to the buyer.
- Card: set only by the PayHere webhook. Never from the browser return URL.

### 7.3 Pricing (single function, fully unit-tested)

`calculateTotals({ items, deliveryOption, coupon, shipDistrict })` in `server/services/pricing.ts`:
1. `subtotal = Σ unit_price × qty` (prices read fresh from the DB, never from the client).
2. Delivery fee from the chosen option; the option must be valid for `shipDistrict`; zero if `free_over_cents` is met.
3. Coupon applied to subtotal (percent rounds down to whole rupees), or to delivery for `free_delivery`. Discount never exceeds subtotal.
4. `total = subtotal − discount + delivery`.

The server recalculates on order placement. If the result differs from the total the buyer saw (sent with the form), return `PRICE_CHANGED` and show the new total for confirmation.

### 7.4 Stock
- Decrement inside the order transaction with `UPDATE … SET stock = stock - qty WHERE id = … AND stock >= qty`. If any row fails, abort with `OUT_OF_STOCK` naming the item.
- `stock = null` means untracked (never blocks).

### 7.5 Placing an order (exact sequence)
In one database transaction:
1. Validate input (zod); rate-limit by IP and phone.
2. Reject if the shop is not `active` or its subscription is not `trialing`/`active`.
3. Reject if the customer phone is blocked (generic message, no detail).
4. Check the idempotency key; if an order exists, return it.
5. Recalculate totals; decrement stock.
6. Upsert customer; allocate order number; insert order, items, `placed` event.
7. Commit.

After commit only: send Inngest event `order/placed`. Emails, seller alerts and analytics run in jobs. A failing job must never affect the buyer's success page.

### 7.6 Subscription and trial
- Trial: 14 days from shop creation, no card.
- Reminder emails to the seller at day 7, 11 and 13; dashboard banner from day 7 ("Your trial ends in N days").
- At expiry without payment: shop `paused` → storefront shows "This shop is taking a short break" with a WhatsApp button; checkout disabled; seller can still log in, view data and pay. No data deleted.
- **OPEN QUESTION:** Pro plan price (monthly LKR). Use `PRO_PLAN_PRICE_CENTS` env var; placeholder 199000 (Rs 1,990).
- **OPEN QUESTION:** Phase 1 Pro payments — PayHere Recurring for Sidadiya, or manual bank transfer approved by an admin. Build the admin "mark as paid for N months" action first; add PayHere Recurring if credentials are ready.

### 7.7 Card payments (Phase 2) — per-shop PayHere account
- Each shop enters its own PayHere Merchant ID and Merchant Secret in settings. The secret is encrypted with AES-256-GCM using `ENCRYPTION_KEY` (env, 32 bytes) before storage and never sent to the client.
- Checkout posts to PayHere Checkout with `merchant_id`, `return_url`, `cancel_url`, `notify_url` (`/api/webhooks/payhere?shop={shopId}`), `order_id` (our order number), `items`, `currency=LKR`, `amount` (2 decimals), buyer fields and `hash`.
- `hash = UPPER(MD5(merchant_id + order_id + amount_formatted + currency + UPPER(MD5(merchant_secret))))`.
- Webhook verification: `md5sig == UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(MD5(merchant_secret))))`; also check amount and currency match the order. `status_code`: `2` success, `0` pending, `-1` cancelled, `-2` failed, `-3` chargedback.
- The webhook must be idempotent (unique on `gateway_payment_id`) and return 200 quickly.
- **Verify all of the above against the current PayHere developer docs before implementing**, and record any difference in `DECISIONS.md`.

### 7.8 Analytics capture
- On the first storefront request per session, read `utm_source` (or `?ref=`) or the `document.referrer` host, map it to `source`, store it in a first-party cookie `sd_src` (30 days) and send a non-blocking beacon to `/api/track` that writes a `visits` row.
- Mapping: `l.facebook.com | m.facebook.com | facebook.com | fb` → facebook; `l.instagram.com | instagram` → instagram; `wa.me | whatsapp` → whatsapp; `tiktok` → tiktok; `google.` → google; none → direct; anything else → other.
- The order copies `source` and `utm` from the cookie.

---

## 8. Screens and routes

Design mobile-first at 375 px width; scale up to tablet and desktop. Every buyer screen must work inside the Facebook and WhatsApp in-app browsers.

### 8.1 Public storefront — `/store/[slug]`
- Header: shop logo (or initials avatar), name, cart icon with count.
- Cover band in brand colour; shop card with logo, name, tagline, rating (Phase 2), city, "Replies on WhatsApp".
- Buttons: **WhatsApp** (opens `wa.me/{number}?text=Hi {shop}, I'm looking at your shop`) and **Share** (Web Share API, fallback copy link).
- Search field; filter chips: All, On sale, New arrivals; sort (Newest, Price low–high, Price high–low).
- "What buyers say" (Phase 2).
- Product grid, 2 columns on phone: image, name, price, compare-at price struck through, SALE badge, wishlist heart (local only).
- Footer: shop policy links, "Powered by Sidadiya".
- SEO/OG: title, description, image (cover or first product) so links preview in Facebook and WhatsApp.
- Cache with ISR; revalidate on product or shop change (`revalidateTag('shop:{id}')`).

### 8.2 Product page — `/store/[slug]/p/[productSlug]`
Image gallery (swipe), name, price, variant pickers (disabled when out of stock), quantity, **Add to cart**, **Buy now**, description, WhatsApp "Ask about this item".

### 8.3 Cart — drawer, plus `/store/[slug]/cart`
Stored in localStorage per shop (reads and writes wrapped in try/catch). Line items, quantity steppers, remove, subtotal, **Checkout**.

### 8.4 Checkout — `/store/[slug]/checkout`
Single page with a step indicator (Contact → Delivery → Payment → Review); each step collapses once complete and has an Edit link:
1. Contact: full name, mobile, email (optional, "for your receipt and tracking updates").
2. Delivery: address line 1, line 2, city, district (select), delivery option (filtered by district) with fee.
3. Payment: radio list of the shop's enabled methods. Bank transfer shows bank details after placing the order.
4. Review: all details with Edit links, items, subtotal, delivery, discount, total; optional "Note for the shop" (placeholder "e.g. Gift wrap please, or call before delivery"); sticky bottom bar with item count, total and **Place order**.

Buyer details remembered in localStorage for return visits.

### 8.5 Order success
Order number, summary, what happens next, buttons **Track your order** and **Share on WhatsApp**; for bank transfer, bank details plus slip upload.

### 8.6 Tracking page — `/o/[token]`
Shop header; order number; status badge; progress timeline (Placed, Confirmed, Packed, Shipped with courier, tracking number and **Track parcel** link, Delivered) with timestamps; items summary; delivery address; payment method; **View receipt**; Phase 2: **I received my order** and a review form. `noindex`.

### 8.7 Receipt — `/r/[token]`
Shop name, address, phone, email; receipt number (= order number); date; customer; payment method plus "Pay on delivery" badge when COD is unpaid; items table (item, qty, amount, unit price under the name); subtotal, delivery, discount, **Total**; footer "Thank you for shopping with {shop}. This receipt link works until {date + 30 days}."; buttons **Print or save as PDF**, **Share on WhatsApp**, **Visit the shop**. After 30 days, show "This receipt has expired, contact the shop". `noindex`.

### 8.8 Seller auth — `/signup`, `/login`
Mobile number → 6-digit OTP (5-minute expiry, max 5 attempts, resend after 60 s) → if new, name. Email magic link as an alternative.

### 8.9 Onboarding — `/dashboard/setup`
Goal: shop live in under 10 minutes. Steps: shop name → slug (live availability check, suggestion from name) → logo (optional) → WhatsApp number (prefilled) → payment methods and bank details → delivery options (default "Islandwide delivery, Rs 400") → add first product → "Your shop is live" with copy-link and share buttons.
**OPEN QUESTION:** default delivery fee; use Rs 400 as placeholder.

### 8.10 Seller dashboard — `/dashboard`
Bottom tab bar on phone: Home, Orders (badge = new orders), Products, Reports (Phase 2), More.
- **Home:** greeting ("Good morning, Kasun"), "Here is how {shop} is doing today": today's orders, revenue, orders to ship; trial/plan banner with **Renew now**; "Get ready for card payments" checklist (Phase 2); **Add product** button; light/dark toggle.
- **Orders:** tabs New / To pack / Shipped / All; a card per order (number, buyer, total, method, status badge, time ago); search by number, phone or name.
- **Order detail:** timeline, buyer contact (tap to call, WhatsApp), address (copy), items, totals, payment status with actions (Mark cash received, Approve or Reject slip), status buttons (Confirm, Mark packed, Mark shipped → courier and tracking sheet, Mark delivered, Cancel), seller note, **Print waybill**, **Send receipt on WhatsApp**.
- **Batch actions:** select orders → Print waybills (1 per A6, or 4 per A4), Mark packed.
- **Products:** list with image, name, price, stock, status; add/edit form (images with drag reorder, variant editor generating option combinations, stock per variant); duplicate; archive.
- **Customers:** list, order count, total spent, block toggle.
- **Settings:** shop profile, payments, delivery options, policies, receipt footer, plan and billing, account.

### 8.11 Platform admin — `/admin` (users with `is_platform_admin`)
Shops list with plan status; extend trial; mark subscription paid; suspend shop; read-only view of a shop (audited).

---

## 9. Documents

### 9.1 Waybill (A6: 105 × 148 mm, portrait)
- Top: shop initials avatar and name; order number large (monospace); placed date; QR code (top right) linking to `/o/{token}`.
- Box "DELIVER TO": buyer name (bold), phone (bold, large), address lines, **city, district** in bold.
- "FROM": shop name, address, phone.
- "ITEMS (n PCS)": lines like `1 × Cotton Kurta (L)`, truncated after 4 with "+ n more".
- Bottom boxes: "CASH ON DELIVERY Rs. 5,550" (shows "PAID" when not COD), "TRACKING NO." (filled, or blank for handwriting).
- Footer: payment method, "Sidadiya".
- Must print correctly on A6 label printers and on A4 (4 per sheet with cut marks).

### 9.2 Receipt PDF
Same content as the receipt page, A5, shop branding.

---

## 10. Notifications

All sent from Inngest functions, logged in `email_log`, retried with backoff (max 5 attempts).

| Event | To | Channel | Phase |
| --- | --- | --- | --- |
| Order placed | Buyer (if email) | Email: summary, tracking link, bank details if transfer | 1 |
| Order placed | Seller | Email + dashboard badge; SMS in Phase 3 | 1 |
| Slip uploaded | Seller | Email | 1 |
| Payment approved or rejected | Buyer | Email | 1 |
| Order confirmed | Buyer | Email | 1 |
| Order shipped | Buyer | Email: courier, tracking number, **Track your parcel**, View your order, Visit the shop | 1 |
| Order delivered | Buyer | Email (with review request in Phase 2) | 1 |
| Trial day 7, 11, 13 and expired | Seller | Email | 1 |
| Weekly summary (Monday 08:00 Asia/Colombo) | Seller | Email: orders, revenue, top products, top sources, top towns | 2 |

Sender: `"{Shop name} via Sidadiya" <orders@mail.sidadiya.com>`, reply-to the shop email. Templates in React Email, mobile-first, with the shop's brand colour in the header bar.

---

## 11. Visual design

Brand tokens (approximated from the marketing ads in `docs/brand/` — confirm exact values with the designer):

| Token | Value | Use |
| --- | --- | --- |
| `--brand-green` | `#14532D` | Primary buttons in dashboard, footer bars, check icons |
| `--brand-yellow` | `#E9A825` | Marketing CTAs ("Open your shop") |
| `--brand-highlight` | `#F5CB6A` | Highlighter underline on marketing headlines |
| `--brand-cream` | `#FAF6EF` | Marketing page background |
| `--brand-mint` | `#DCEFE6` | Decorative circles, soft panels |
| `--shop-plum` | `#7A2D5B` | Default shop accent in storefront (avatar, buttons); each shop can override with `brand_color` |

- Font: Inter for UI (or a geometric sans chosen by the designer), with Noto Sans Sinhala and Noto Sans Tamil fallbacks.
- Radius 12 px on cards, fully rounded pills; tap targets at least 44 px.
- Light and dark mode in the dashboard.
- Storefront derives its accent from the shop's `brand_color`, auto-picking white or black text to keep 4.5:1 contrast.

---

## 12. Security, privacy, performance

- Rate limits: OTP send 3 per 10 min per phone and 10 per hour per IP; checkout 10 per 10 min per IP; slip upload 5 per hour per order.
- Uploads: images only (JPEG, PNG, WebP, HEIC → converted), max 10 MB, resized to 1600 px max and stored as WebP; slips also accept PDF, max 5 MB. Use signed upload URLs.
- CSRF protection on all mutations (server actions plus same-site cookies). Security headers (CSP, HSTS, frame-ancestors).
- Secrets only in environment variables; never sent to the client.
- Sri Lanka Personal Data Protection Act: privacy policy, data export and deletion for sellers, buyer data deletion on request through the shop. Never log buyer personal data.
- Performance budgets: storefront LCP under 2.0 s on a mid-range Android phone over 4G; storefront JS under 120 KB gzipped; images lazy-loaded with `next/image`.
- Backups: Supabase point-in-time recovery enabled; monthly restore drill documented.

---

## 13. Quality gates

`pnpm check` runs typecheck, lint, and unit + integration tests. CI also runs Playwright against a production build with a seeded database.

Required tests (minimum):
- **Unit:** `money`, `phone`, `pricing.calculateTotals` (at least 20 cases including coupons, free delivery and rounding), order status machine (every allowed and rejected transition), PayHere hash and signature helpers, slug validation, source mapping.
- **Integration** (real Postgres in Docker): place order (happy path, out of stock, price changed, idempotent double submit, blocked phone, paused shop), tenant isolation (cross-shop read and write denied for every tenant table), webhook idempotency and forged-signature rejection.
- **E2E** (Playwright, 390 × 844 viewport): seller signs up → onboarding → adds product → buyer orders with COD → seller confirms and ships with tracking → buyer sees tracking page update → receipt and waybill render.

Definition of done for any feature: works on a phone viewport, has tests for its logic, handles loading, empty and error states, uses i18n keys, has no TypeScript errors, and `docs/PROGRESS.md` is updated.

---

## 14. Milestones

Each milestone ends with all checks green, a staging deploy, and `PROGRESS.md` updated.

**M0 — Foundation (days 1–3)**
Repo, Next.js, Tailwind, shadcn, ESLint/Prettier, Vitest, Playwright, Drizzle with local Postgres via Docker Compose, env validation (`src/env.ts`), Sentry, GitHub Actions, Vercel project with preview deploys, `money` and `phone` libs with tests, i18n scaffold, base layout and design tokens.
✅ `pnpm dev` runs; CI green; staging URL live.

**M1 — Auth, shops, tenancy (days 4–7)**
Better Auth phone OTP (Text.lk adapter plus console adapter for dev), users, shops, members, subscriptions (trial created with the shop), `withShop` plus RLS, onboarding flow, reserved slugs.
✅ A new seller reaches an empty dashboard with a live (empty) store URL; tenant isolation tests pass.

**M2 — Catalogue and storefront (days 8–14)**
Products, variants, images (R2 upload), dashboard product CRUD, storefront home, product page, cart, search and filters, OG tags, ISR revalidation.
✅ A seller adds a product with variants and photos from a phone; a buyer can browse and add to cart.

**M3 — Checkout and orders (days 15–24)**
Delivery options, pricing service, checkout page, place-order transaction, success page, bank-transfer slip upload, seller orders list and detail, status machine, cancel and restock, customers.
✅ COD and bank-transfer orders work end to end; all checkout integration tests pass.

**M4 — Notifications, tracking, documents (days 25–33)**
Inngest, Resend and React Email templates, all Phase 1 notifications, tracking page, receipt page and PDF, waybill PDF (single and batch), WhatsApp share links.
✅ Full E2E test passes; a printed waybill is checked on paper.

**M5 — Billing and admin (days 34–40)**
Trial reminders, pause on expiry, renew flow (admin mark-paid first, PayHere Recurring if ready), admin panel, audit log.
✅ An expired trial pauses the store; an admin can reactivate it.

**M6 — Hardening and pilot launch (days 41–50)**
Rate limits, security headers, performance pass against budgets, accessibility pass, error and empty states everywhere, legal pages, backup restore drill, uptime monitoring, seed/demo shop "ABC Fashion".
✅ Launch checklist (section 15) complete; 10 pilot shops onboarded.

**Phase 2 (after the pilot gate):** readiness checklist, PayHere card payments, coupons, visits and reports, weekly summary, delivery confirmation and reviews.
**Phase 3:** courier APIs, SMS notifications, WhatsApp Cloud API, Sinhala and Tamil, staff accounts.

---

## 15. Launch checklist

- [ ] All E2E tests pass on staging, and a production smoke test passes
- [ ] Real orders placed from Facebook and WhatsApp in-app browsers on Android and iPhone
- [ ] Waybills printed on A6 and A4 and accepted by a courier
- [ ] Emails land in the Gmail inbox (SPF, DKIM, DMARC set for mail.sidadiya.com)
- [ ] Database restore tested
- [ ] Sentry and uptime alerts reach the founders' phones
- [ ] Privacy policy, terms and refund policy published
- [ ] 10 pilot shops ran two weeks with zero lost orders

---

## 16. Environment variables

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=https://sidadiya.com
ENCRYPTION_KEY=                     # 32 bytes, base64; encrypts shop secrets
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
NEXT_PUBLIC_ASSETS_URL=
RESEND_API_KEY=
EMAIL_FROM_DOMAIN=mail.sidadiya.com
TEXTLK_API_KEY=
TEXTLK_SENDER_ID=Sidadiya
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
PAYHERE_SANDBOX=true
SIDADIYA_PAYHERE_MERCHANT_ID=       # Sidadiya's own account for Pro billing
SIDADIYA_PAYHERE_MERCHANT_SECRET=
PRO_PLAN_PRICE_CENTS=199000
TRIAL_DAYS=14
```

Validate all of them at startup in `src/env.ts`; the app must fail fast with a clear message when a required one is missing. In development, SMS, email and storage adapters fall back to console/local implementations when keys are absent, so `pnpm dev` works with only `DATABASE_URL` and `BETTER_AUTH_SECRET`. Commit a `.env.example` with every key.

---

## 17. Open questions for founders

1. Pro plan monthly price.
2. Phase 1 Pro billing: PayHere Recurring or manual bank transfer?
3. Card payments: confirm per-shop PayHere accounts (assumed) rather than Sidadiya collecting and paying out.
4. Default delivery fee for new shops.
5. Exact brand colours and fonts from the designer.
6. Which couriers pilot sellers use most (decides Phase 3 order).
7. Company legal name and address for terms and the receipt footer.
