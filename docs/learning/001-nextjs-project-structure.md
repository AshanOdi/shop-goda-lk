# 001 — The Next.js project structure (for a React + Express developer)

**Milestone:** M0 · **Branch:** m0/project-setup · **Commits:**
`379dd7e chore: scaffold Next.js app with TypeScript, Tailwind and ESLint` ·
`de17bc9 chore: add prettier with tailwind class sorting` ·
`8f21ef6 style: format codebase with prettier` ·
`chore: add typecheck and check scripts`

## What we built

An empty Next.js app with TypeScript, Tailwind CSS, ESLint and Prettier, plus a `pnpm check` command that tells us whether the code is healthy. Nothing Ape Kade-specific yet: this is the base every later feature is built on.

## Why it matters

Every page buyers and sellers see, and every piece of server logic (placing orders, PayHere webhooks), will live inside this one Next.js app. `pnpm check` is the gate every commit must pass (CLAUDE.md), so broken code is caught before it reaches `main`.

## New concepts

### How do we know this is Next.js and not plain React?

Three places tell you:

1. **`package.json`**: `"next": "16.4.0"` is a dependency, and the scripts call `next dev` / `next build`, not `vite` or `react-scripts`.
2. **`next.config.ts`**: the Next.js settings file.
3. **Imports from `next/...`**: `next/image`, `next/font/google`, `next/link`, `next/navigation`. Plain React has none of these.

The JSX syntax itself does **not** change. A component is still a function returning JSX, with `className`, props, and `{...}` expressions. What changes is *where files go* and *where code runs*.

### Idea 1: folders are URLs (file-based routing)

In React you used React Router, and in Express you wrote `app.get("/path", ...)`. In Next.js, **the folder structure under `src/app/` is the router.**

| File | URL | Express / React equivalent |
| --- | --- | --- |
| `src/app/page.tsx` | `/` | `<Route path="/" element={<Home/>} />` |
| `src/app/pricing/page.tsx` | `/pricing` | `<Route path="/pricing" ...>` |
| `src/app/store/[slug]/page.tsx` | `/store/abc-fashion` | `app.get("/store/:slug", ...)` |
| `src/app/api/track/route.ts` | `POST /api/track` | `app.post("/api/track", handler)` |

Special file names (Next.js calls them **file conventions**):

- `page.tsx`: the page shown at that URL. Only folders with a `page.tsx` are public pages.
- `layout.tsx`: a wrapper around every page inside that folder (header, footer). It stays mounted when you navigate between those pages.
- `route.ts`: an API endpoint, like an Express handler. It exports functions named after HTTP methods: `export async function POST(request) {...}`.
- `loading.tsx` / `error.tsx` / `not-found.tsx`: shown automatically while loading, on an error, or for a 404. We'll use these for the "every screen handles loading, empty and error states" rule.
- `[slug]`: square brackets make a dynamic segment (Express `:slug`).
- `(seller)`: round brackets group folders **without** adding to the URL. `src/app/(seller)/dashboard/page.tsx` is just `/dashboard`.

### Idea 2: components run on the server by default (Server Components)

In plain React, every component runs in the browser. In Next.js App Router, **every component runs on the server unless you say otherwise.** That means a page component can talk to the database directly, like Express code, and send finished HTML to the phone:

```tsx
// src/app/store/[slug]/page.tsx — runs on the server
export default async function StorePage({ params }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug); // server-only code, no fetch() or useEffect
  return <h1>{shop.name}</h1>;
}
```

Notice: the component is `async`, and there's no `useEffect` or loading state for fetching. The browser never downloads this code, which keeps buyer pages small and fast on mobile data (SPEC 12: under 120 KB of JS).

When you need interactivity (`useState`, `onClick`, `localStorage`, like the cart), put `"use client"` at the top of the file. That component and its imports then also run in the browser, like normal React:

```tsx
"use client";
import { useState } from "react";

export function QuantityStepper() {
  const [qty, setQty] = useState(1);
  return <button onClick={() => setQty(qty + 1)}>{qty}</button>;
}
```

Rule of thumb: keep pages as server components and make only the small interactive pieces client components.

### Idea 3: Server Actions replace many API endpoints

In React + Express, a form calls `fetch("/api/orders", { method: "POST" })` and Express handles it. In Next.js you can write a function marked `"use server"` and call it straight from a form. Next.js creates the endpoint for you. We'll use this for checkout in M3, and learn it properly then.

### Idea 4: Next.js-only building blocks

- `next/image` (`<Image>`): resizes and lazy-loads images automatically. You must give `width` and `height` so the page doesn't jump while loading.
- `next/font`: downloads Google fonts at build time and serves them from our own domain (faster, no layout jump).
- `metadata` export: sets `<title>` and the preview shown when a link is shared on WhatsApp or Facebook (SPEC 8.1).
- `next/link` (`<Link>`): like React Router's `<Link>`; it prefetches the next page.

### Idea 5: Next.js 16 specifics in our config

`next.config.ts` has `cacheComponents: true` and `partialPrefetching: true`. With Cache Components, **data is fresh (dynamic) by default**, and we opt in to caching with a `"use cache"` directive. This is new in Next.js 16. Older tutorials talk about `getServerSideProps` or `export const revalidate`, which don't apply here. When a tutorial disagrees with our code, trust the docs bundled in `node_modules/next/dist/docs/` (see `AGENTS.md`).

### Tooling added in this task

- **TypeScript (`tsc`)**: checks types without running the code. `strict: true` is on in `tsconfig.json`.
- **`next typegen`**: generates types for our routes (for example `LayoutProps<"/">` in `layout.tsx`), so `tsc` can check them.
- **ESLint**: finds bugs and bad patterns, such as a missing `alt` on an image.
- **Prettier**: formats code (spaces, quotes, line length). `eslint-config-prettier` stops ESLint arguing with it.

## How it works

`pnpm dev` → Next.js reads `next.config.ts` → scans `src/app/` for routes → a browser asks for `/` → Next.js renders `layout.tsx` wrapping `page.tsx` **on the server** → sends HTML (plus JS only for client components) → React "hydrates" the page in the browser, which means it attaches click handlers to the HTML it received.

`pnpm check` → `typecheck` (generates route types, then `tsc`) → `lint` (ESLint) → `format:check` (Prettier). If any step fails, the next ones don't run.

## Files changed

| File | What it does |
| --- | --- |
| `package.json` | Dependencies and scripts (`dev`, `build`, `lint`, `typecheck`, `format`, `check`) |
| `pnpm-lock.yaml` | Exact version of every package; makes installs repeatable |
| `next.config.ts` | Next.js settings (Cache Components, Tailwind via Turbopack) |
| `tsconfig.json` | TypeScript settings; `@/*` points to `src/*` |
| `eslint.config.mjs` | ESLint rules (Next.js + TypeScript + Prettier compatibility) |
| `.prettierrc.json`, `.prettierignore` | Prettier rules and files it skips |
| `src/app/layout.tsx` | Root layout: the `<html>` and `<body>` for every page, fonts, metadata |
| `src/app/page.tsx` | The `/` page (Next.js welcome page for now) |
| `src/app/globals.css` | Tailwind import and global CSS variables |
| `public/` | Static files served as-is (`/next.svg`) |
| `AGENTS.md` | Next.js 16 notes for AI tools; regenerated by `next dev` |

## Key code, explained

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
```

- `export const metadata`: Next.js reads this and writes the `<title>` and `<meta>` tags for you. No `react-helmet` needed.
- `RootLayout`: in plain React, `index.html` has `<html>` and `<body>`. In Next.js, the root layout renders them.
- `{children}`: the current page (`page.tsx`) is passed in here, the same as `children` in any React component.
- `LayoutProps<"/">`: a type Next.js generates (`next typegen`) so TypeScript knows exactly what props this layout gets.

## Try it yourself

1. Run `pnpm dev` and open http://localhost:3000.
2. Create `src/app/hello/page.tsx`:
   ```tsx
   export default function Hello() {
     return <h1 className="p-8 text-2xl">Hello Ape Kade</h1>;
   }
   ```
   Open http://localhost:3000/hello. You made a route without touching any router.
3. Add `console.log("where am I?")` inside `Hello`. It prints in the **terminal**, not the browser console, which proves the component ran on the server.
4. Undo: `rm -r src/app/hello`.

## Check your understanding

1. Which file would you create so the URL `/o/abc123` works?
2. You want a button that adds an item to a cart stored in `localStorage`. Server or client component?
3. Why don't we need `useEffect` + `fetch` to load a shop on the storefront page?

<details>
<summary>Answers</summary>

1. `src/app/o/[token]/page.tsx`. The `[token]` folder catches `abc123`.
2. Client component (`"use client"`), because `localStorage` and `onClick` only exist in the browser.
3. The page is a Server Component: it runs on the server, can `await` the data directly, and sends finished HTML.

</details>

## Words to know

- **App Router**: Next.js routing based on the `src/app/` folder.
- **Route segment**: one folder in a URL path (`store`, `[slug]`).
- **Server Component**: a component that runs only on the server (the default).
- **Client Component**: a component marked `"use client"` that also runs in the browser.
- **Hydration**: React attaching event handlers to server-rendered HTML in the browser.
- **devDependency**: a package needed only while developing (Prettier, ESLint), not in production.
- **Lockfile** (`pnpm-lock.yaml`): the record of exact installed versions.
