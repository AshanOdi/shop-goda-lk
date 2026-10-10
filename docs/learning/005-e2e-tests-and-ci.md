# 005 — End-to-end tests and continuous integration

**Milestone:** M0 · **Branch:** m0/testing-ci · **Commits:**
`chore: add playwright for end-to-end tests` ·
`test(e2e): check home page and health endpoint on a phone viewport` ·
`ci: run checks, build and e2e tests on github actions` ·
`docs: record testing and ci decisions`

## What we built

Playwright tests that open Ape Kade in a real browser at phone size and check what a user would see. A GitHub Actions workflow runs all our checks automatically on every pull request. `main` is protected, so nothing gets merged unless those checks pass.

## Why it matters

Unit tests (note 002) prove that single functions work. End-to-end tests prove the **whole app** works together: server, database, translations and page layout. Running everything in CI means a broken change is caught on the pull request, by a machine, every time, even when we forget to run `pnpm check`. That's how "a buyer can always place an order" stays true as the code grows.

## New concepts

### Unit tests vs end-to-end (E2E) tests

| | Unit (Vitest) | End-to-end (Playwright) |
| --- | --- | --- |
| Tests | One function | The real app in a real browser |
| Example | `formatLKR(505000) === "Rs 5,050"` | Open `/`, see the heading, tap the button |
| Speed | Milliseconds | Seconds |
| Needs | Nothing | Running server, database, browser |

We write many unit tests and fewer E2E tests that cover the most important journeys. SPEC 13's big one: seller signs up → adds product → buyer orders → seller ships.

### Playwright basics

```ts
test("shows the call to action", async ({ page }) => {
  await page.goto("/"); // open a URL (relative to baseURL)
  const cta = page.getByRole("link", { name: "Create your shop" }); // find an element
  await expect(cta).toHaveAttribute("href", "/signup"); // check it
});
```

- **`page`**: a browser tab Playwright controls.
- **Locators** like `getByRole("link", { name: ... })` find elements the way a user or screen reader would: "the link called *Create your shop*". They don't use CSS classes, which change often. If a test can't find something by role and name, real users with screen readers probably can't either.
- **`await expect(...)`** waits and retries until the condition is true (up to a timeout), so tests don't break just because the page took 200 ms longer.
- **`request`**: makes plain HTTP requests without a browser, which we use for `/api/health`.
- **`webServer`** in `playwright.config.ts`: Playwright starts the app itself before the tests (or reuses your running `pnpm dev`).

### Viewport and device emulation

`viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true` makes desktop Chrome behave like a phone: a narrow screen, touch events and the mobile meta viewport. Most of our buyers come from phones (SPEC 1), so every E2E test runs this way.

### Continuous integration (CI) and GitHub Actions

**CI** means every change is automatically checked on a clean machine. **GitHub Actions** is GitHub's CI service. A **workflow** is a YAML file in `.github/workflows/`:

```yaml
on:
  pull_request: # when: every PR...
  push:
    branches: [main] # ...and every push to main
jobs:
  check: # one job, on a fresh Ubuntu machine
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7 # a ready-made step: download our code
      - run: pnpm check # a shell command
```

- **`uses:`** runs a published **action** (reusable step) at a pinned version, like `@v7`.
- **`run:`** runs a shell command, exactly like you do in your terminal.
- **`services:`** starts extra containers for the job, here a Postgres just like `compose.yaml`.
- **`env:`** sets environment variables, the CI version of `.env.local`. These are test-only values; real secrets would go in GitHub's encrypted **Secrets**, never in the file.
- `pnpm install --frozen-lockfile` fails if `pnpm-lock.yaml` doesn't match `package.json`, so CI installs exactly what we tested locally.

### YAML in two minutes

YAML is a settings format that uses **indentation** (spaces, never tabs) for nesting. `key: value` pairs, `- item` for lists, `#` for comments. Indentation mistakes are the most common YAML error.

### Branch protection

A GitHub setting on `main` that says "only merge through a pull request, and only when the `check` job is green". It would have stopped the direct push to `main` in task 2.

## How it works

You push a branch and open a PR → GitHub sees `.github/workflows/ci.yml` → starts an Ubuntu machine and a Postgres container → checks out the code → installs pnpm (version from `packageManager`) and Node 22 → `pnpm install --frozen-lockfile` → `pnpm check` (types, lint, format, unit tests) → `pnpm build` (production build) → installs Chromium → `pnpm test:e2e`: Playwright runs `pnpm start`, waits for `http://localhost:3000`, runs the tests at 390 × 844 → the PR shows ✅ or ❌. On failure, the HTML report is uploaded so you can download it and see what went wrong.

## Files changed

| File | What it does |
| --- | --- |
| `playwright.config.ts` | Test folder, phone viewport, retries in CI, starts the app |
| `tests/e2e/home.spec.ts` | Home page content, no sideways scroll, tap target size, health check |
| `.github/workflows/ci.yml` | The CI pipeline |
| `package.json` | `test:e2e` script, `@playwright/test` |
| `.gitignore`, `.prettierignore` | Ignore Playwright output folders |

## Key code, explained

```ts
test("fits a phone screen without sideways scrolling", async ({ page }) => {
  await page.goto("/");
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
```

- `page.evaluate(() => ...)` runs that function **inside the browser page** and returns the result to the test.
- `scrollWidth` is how wide the content is; `clientWidth` is how wide the screen is. If content is wider, the page scrolls sideways, which feels broken on a phone.
- One wide image or a long word without wrapping would fail this test before any buyer sees it.

## Try it yourself

```bash
pnpm test:e2e                 # runs headless (no visible browser)
pnpm exec playwright test --ui    # opens Playwright's UI: watch each step, time-travel through it
pnpm exec playwright show-report  # after a failure: open the HTML report
```

Experiment: in `messages/en.json` change `"cta"` to `"Start now"` and run `pnpm test:e2e`. Two tests fail because they can't find the "Create your shop" link. That's exactly the safety net. Undo with `git restore messages/en.json`.

## Check your understanding

1. Why do we find the button with `getByRole("link", { name: "Create your shop" })` instead of a CSS class?
2. Where does the CI job's database come from?
3. What stops someone merging a PR whose tests fail?

<details>
<summary>Answers</summary>

1. Roles and names are what users and screen readers see; classes change with styling. It also checks accessibility for free.
2. The `services: postgres` block starts a fresh Postgres container for every CI run.
3. Branch protection on `main` requires the `check` job to pass before merging.

</details>

## Words to know

- **E2E test**: a test of the whole app through a real browser.
- **Locator**: Playwright's way of finding an element (by role, label, text...).
- **Viewport**: the visible area of the page (390 × 844 = a modern phone).
- **CI (continuous integration)**: automatic checks on every change.
- **Workflow / job / step**: a CI file / a machine running steps / one command or action.
- **Service container**: an extra container (like Postgres) started for a CI job.
- **Branch protection**: GitHub rules that guard a branch like `main`.
