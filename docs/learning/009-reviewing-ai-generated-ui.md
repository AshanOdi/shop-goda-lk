# 009 — Reviewing an AI-generated design (v0)

**Milestone:** M1 · **Branch:** m1/home-redesign

## What we built

We took a home page redesign that v0 (Vercel's AI design tool) had pushed to its own branch, brought only its two files into our branch, and fixed it until it met the same rules as our own code. The page now has a dark "ink" background with clay maroon and citrus orange accents.

## Why it matters

AI tools write code fast, but they don't know our rules. The v0 branch failed CI (Prettier), had 12 hard-coded English strings (breaking Phase 3 Sinhala/Tamil), low-contrast text, a small tap target and a made-up statistic. Treating AI output like any contributor's pull request (review, fix, test) keeps quality and the "one rule" safe.

## New concepts

### Taking files from another branch

```bash
git checkout origin/v0/redesign-page-8ba73221 -- src/app/page.tsx src/app/globals.css
```

`git checkout <branch> -- <files>` copies just those files from another branch into your working folder (and stages them), without merging the whole branch. That's useful when the other branch is based on old code.

### Colour contrast (WCAG)

Text must stand out from its background. The **contrast ratio** goes from 1:1 (invisible) to 21:1 (black on white). WCAG AA requires **4.5:1** for normal text and 3:1 for large text. We measured every pair. Orange text on the maroon card was 3.5:1, so it became peach (5.4:1). 75% sand on maroon was 4.4:1, so it became 90% (5.6:1). Many sellers and buyers use cheap phones outdoors in sunlight, so contrast matters.

### Opacity modifiers

`text-brand-sand/70` means the sand colour at 70% opacity. Lower opacity means lower contrast, so check it.

### Rich text with a custom tag

```json
"title": "Your shop, <accent>finally</accent> in one place."
```

```tsx
t.rich("title", { accent: (chunks) => <span className="text-brand-orange">{chunks}</span> });
```

The translator decides where the highlighted word goes; the code decides how it looks.

### Honest placeholders

The sample dashboard shows "128" orders. A marketing page must not present invented numbers as real results, so the card carries an "Example" badge.

## Files changed

| File | What it does |
| --- | --- |
| `src/app/globals.css` | New palette for the brand tokens and shadcn colours |
| `src/app/page.tsx` | Redesigned home page, all text via next-intl |
| `messages/en.json` | New and renamed home page messages |
| `tests/e2e/home.spec.ts` | Expects the new heading |
| `docs/SPEC.md` | Section 11 tokens and the contrast rule |

## Check your understanding

1. Why not merge the whole v0 branch?
2. What contrast ratio does normal-size text need?

<details>
<summary>Answers</summary>

1. It was based on an older `main`; copying only its two files avoids bringing old history and conflicts.
2. At least 4.5:1 (WCAG AA).

</details>
