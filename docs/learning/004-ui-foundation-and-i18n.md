# 004 — UI foundation: shadcn/ui, brand tokens and translations

**Milestone:** M0 · **Branch:** m0/ui-foundation · **Commits:**
`chore(ui): add shadcn/ui and next-intl dependencies` ·
`feat(i18n): set up next-intl with english messages` ·
`feat(ui): add brand tokens and inter font` ·
`feat(ui): replace welcome page with apekade placeholder home` ·
`chore: rename project to ape kade` ·
`docs: record ui foundation decisions`

## What we built

The visual base of Ape Kade: our own brand colours (warm maroon and orange) and font, a library of ready-made components (starting with a Button), and a translation system so no text is hard-coded. The Next.js welcome page is replaced with an Ape Kade home page. We also renamed the project from the product whose spec inspired it (Sidadiya) to Ape Kade, and wrote all the page text ourselves.

## Why it matters

Every screen from now on (storefront, checkout, dashboard) uses these colours, this font and these components, so the whole product looks like one brand. Translations matter because Phase 3 adds Sinhala and Tamil. If every string already goes through next-intl, that becomes "add two files" instead of "rewrite every page".

## New concepts

### Tailwind CSS (a quick recap) and design tokens

Tailwind styles elements with small utility classes in `className` instead of separate CSS files: `px-4` = horizontal padding, `rounded-full` = pill shape, `sm:flex-row` = "row layout from the small breakpoint up" (mobile-first: classes without a prefix apply to phones).

A **design token** is a named design value, like `--brand-maroon: #7a1f2b`. We define tokens once in `globals.css` and Tailwind turns them into classes:

```css
:root {
  --brand-maroon: #7a1f2b; /* the value */
}
@theme inline {
  --color-brand-maroon: var(--brand-maroon); /* creates bg-brand-maroon, text-brand-maroon, ... */
}
```

To change the brand maroon later, edit one line and every button and icon updates.

### shadcn/ui

Most UI libraries are npm packages you can't edit. **shadcn/ui** copies each component's source code into your project (`src/components/ui/button.tsx`), so we own it and can change it. It's built on **Radix UI**, which handles accessibility (keyboard use, screen readers), and styled with Tailwind.

- `pnpm dlx shadcn@latest add card` adds a component.
- `components.json` remembers our choices (style, icon library, paths).
- `buttonVariants` uses **cva** (class-variance-authority) to map props like `variant="outline"` and `size="lg"` to classes.
- `cn(...)` merges class names and resolves Tailwind conflicts: `cn("px-2", "px-6")` → `"px-6"`.

**`asChild`**: `<Button asChild><Link href="/signup">…</Link></Button>` renders the *link* with the button's styles, instead of a `<button>` wrapped around a link (which is invalid HTML and confuses screen readers).

### next/font

`Inter({ variable: "--font-inter", subsets: ["latin"] })` downloads Inter at **build time** and serves it from our own domain. No request to Google when a buyer opens the page, and no flash of a different font. The `variable` option exposes it as a CSS variable, which `globals.css` uses in the font stack.

### next-intl: translations

Text lives in `messages/en.json`, grouped by page:

```json
{ "HomePage": { "eyebrow": "For sellers on Facebook, Instagram, TikTok and WhatsApp" } }
```

Server components read it with `getTranslations`:

```tsx
const t = await getTranslations("HomePage");
<p>{t("eyebrow")}</p>;
```

Client components (`"use client"`) use the hook `useTranslations("HomePage")` instead. `NextIntlClientProvider` in `layout.tsx` makes that possible.

**Rich text:** the title has a highlighted part. The message marks it with a tag, `"Turn your page into a <mark>real online shop.</mark>"`, and `t.rich` decides how to render the tag:

```tsx
t.rich("title", { mark: (chunks) => <mark className="...">{chunks}</mark> });
```

The translator can move the highlight in Sinhala word order without touching code.

**Variables:** `"Share {domain}/store/your-shop..."` has a placeholder, filled in with `t("features.link.body", { domain })`. The domain comes from `env.NEXT_PUBLIC_APP_URL`, so when the final domain is chosen, only the environment variable changes.

### `generateMetadata`

`export const metadata = {...}` (note 001) is fixed. When the title comes from translations, we export an async **`generateMetadata()`** function instead, which can `await getTranslations(...)`.

### Decorative elements and `aria-hidden`

The icons next to each feature are only decoration; the text already says everything. `aria-hidden` hides them from screen readers so they don't read out "image" for each one.

## How it works

Request for `/` → `next.config.ts` (next-intl plugin) finds `src/i18n/request.ts` → locale `en`, messages from `messages/en.json` → `layout.tsx` sets `<html lang="en">`, applies Inter, calls `generateMetadata()` for the `<title>` → `page.tsx` builds the page with `t(...)` strings, brand-colour classes and the shadcn `Button` → HTML is sent to the phone with almost no JavaScript (only what Next.js itself needs).

## Files changed

| File | What it does |
| --- | --- |
| `components.json` | shadcn settings (Radix, Nova preset, Lucide, paths) |
| `src/components/ui/button.tsx` | shadcn Button (generated) |
| `src/lib/utils.ts` | Re-exports `cn` for shadcn components |
| `src/app/globals.css` | Tailwind + shadcn styles, brand tokens, Inter font stack, 12px radius |
| `src/i18n/request.ts` | next-intl config: locale `en`, time zone `Asia/Colombo` |
| `messages/en.json` | All English text |
| `next.config.ts` | Adds the next-intl plugin |
| `src/app/layout.tsx` | Inter font, `lang`, translated metadata, translations provider |
| `src/app/page.tsx` | Placeholder home page in Ape Kade's own style |
| `docs/SPEC.md`, `CLAUDE.md`, ... | Renamed to Ape Kade; SPEC 11 now has Ape Kade's colours; `docs/brand/` marked as feature reference only |
| `compose.yaml`, `.env.example`, `package.json` | Database, user and package renamed to `apekade` |
| `.prettierrc.json`, `.prettierignore` | Sort brand classes correctly; leave shadcn files alone |
| `public/*.svg` | Removed Next.js demo images |

## Key code, explained

```tsx
<Button
  asChild
  size="lg"
  className="h-12 rounded-full bg-brand-orange px-6 text-base font-bold text-brand-ink hover:bg-brand-orange/90"
>
  <Link href="/signup">
    {t("cta")}
    <ArrowRight aria-hidden />
  </Link>
</Button>
```

- `asChild` → the `<Link>` becomes the button (one element, valid HTML).
- `h-12` = 48px tall, above the 44px minimum tap target (CLAUDE.md design rules).
- `rounded-full` = pill shape; `bg-brand-orange` = our call-to-action colour; `text-brand-ink` = dark text, because white on orange is too hard to read; `hover:bg-brand-orange/90` = 90% opacity on hover.
- `className` passed to `Button` is merged with its defaults by `cn`, so ours win where they conflict.
- `/signup` doesn't exist yet (M1), so the link 404s for now.

## Try it yourself

1. `pnpm dev`, open http://localhost:3000, then press F12 → the phone icon (device toolbar) → pick a 375 px wide phone. This is how most buyers will see Ape Kade.
2. In `messages/en.json`, change `"cta"` to `"Start selling"`. The button text changes without touching any `.tsx` file.
3. In `globals.css`, change `--brand-maroon` to `#1d4ed8` (blue). The logo mark, eyebrow text and feature icons all change. Undo both with `git restore messages/en.json src/app/globals.css`.

## Check your understanding

1. Where would you add a Sinhala version of the home page text in Phase 3?
2. Why use `<Button asChild><Link/></Button>` instead of `<Button><Link/></Button>`?
3. Why is `--brand-maroon` defined once in `:root` and then mapped in `@theme`?

<details>
<summary>Answers</summary>

1. A new `messages/si.json` with the same keys, then let `src/i18n/request.ts` pick the locale.
2. A link inside a button is invalid HTML and confusing for keyboards and screen readers; `asChild` renders a single link with button styles.
3. So the value lives in one place: changing it updates every Tailwind class (`bg-brand-maroon`, `text-brand-maroon`) and every shadcn component that uses `--primary`.

</details>

## Words to know

- **Design token**: a named design value (colour, radius, font) used everywhere.
- **Utility class**: a small Tailwind class doing one thing (`px-4`).
- **Mobile-first**: base styles target phones; `sm:`/`md:` prefixes add larger-screen styles.
- **Locale**: a language/region setting (`en`, later `si`, `ta`).
- **Message**: one translatable string, looked up by key.
- **Accessibility (a11y)**: making the UI usable with keyboards, screen readers and small screens.
