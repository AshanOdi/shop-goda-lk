# Working Instructions for Claude Code

These rules cover **how** we work: git, commits, and teaching. `CLAUDE.md` covers the code rules and `docs/SPEC.md` covers **what** we build. Follow all three.

The project owner is new to Next.js and wants to learn the whole codebase as it is built. Building fast matters, but the owner understanding every part matters just as much.

---

## 1. Git and commits

### 1.1 Authorship — no AI attribution

- Commits are authored by the repository owner only, using the existing git config. **Never change `git config user.name` or `user.email`.**
- **Never** add `Co-Authored-By: Claude`, "Generated with Claude Code", session links, or any other AI attribution to commit messages, pull request titles or descriptions, code comments, or docs.
- `.claude/settings.json` already turns off Claude Code's automatic attribution. Do not change that setting.

### 1.2 Small commits — one logical change each

Each commit does **one thing** and can be explained in one sentence. Examples of the right size:

- `chore: add prettier and eslint config`
- `feat(lib): add phone number normalisation with tests`
- `feat(db): add shops table schema`
- `feat(db): add migration for shops table`
- `feat(store): show product grid on storefront page`
- `fix(checkout): reject delivery option not valid for district`

Rules:

1. One logical change per commit. If the message needs "and", it is probably two commits.
2. Aim for under ~200 changed lines per commit, excluding generated files (lockfile, migrations, shadcn components). Larger is fine only when it cannot be split sensibly.
3. Every commit must leave the project working: `pnpm check` passes (once it exists) and the app starts.
4. Tests go in the same commit as the code they test.
5. Generated files get their own commit where practical (for example, `chore: add shadcn button component`, or the Drizzle migration separate from the schema change).
6. Learning notes (section 2) go in their own commit: `docs(learning): explain storefront routing`.
7. Never commit secrets, `.env` files, build output or `node_modules`.
8. Use `git add <specific files>`, never `git add -A` or `git add .`, so nothing unintended slips in. Check `git status` and `git diff --staged` before every commit.

### 1.3 Commit message format (Conventional Commits)

```
<type>(<scope>): <short summary in present tense, max 72 chars>

<optional body: why this change, anything non-obvious>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `ci`, `build`.
Scopes: `db`, `auth`, `shop`, `store`, `checkout`, `orders`, `payments`, `emails`, `pdf`, `jobs`, `dashboard`, `admin`, `lib`, `ui`, `i18n`, `ci`, `learning`.

### 1.4 Branches and pull requests

- `main` is always deployable. Don't commit directly to `main`.
- One branch per task, named `<milestone>/<short-task>`, for example `m0/project-setup`, `m1/phone-otp-auth`, `m3/place-order-transaction`.
- A task = a few to ~15 small commits that together deliver one piece of a milestone.
- When a task is done: run all checks, push the branch, open a pull request. The PR description lists what changed, how to test it, and links the learning note. No AI attribution in the PR.
- Merge with **rebase or merge commit, never squash** — squashing would throw away the small commits.
- Ask before pushing or opening a PR if the owner hasn't already said to.

---

## 2. Teaching the owner (required for every task)

### 2.1 Before coding a task

Explain the plan in plain words in chat (5–10 lines): what we're building, which files we'll create or change, and why this order. Wait for "go" only if the owner asked to review plans; otherwise start.

### 2.2 After each task — write a learning note

Create `docs/learning/NNN-short-title.md` (NNN = next number, e.g. `003-database-and-drizzle.md`) and add a line for it in `docs/learning/README.md`. Commit it separately.

Use this template:

```markdown
# NNN — <Title>

**Milestone:** M1 · **Branch:** m1/phone-otp-auth · **Commits:** <list of short hashes and messages>

## What we built
Two or three sentences a non-developer could follow.

## Why it matters
Which part of Ape Kade this enables, and what would break without it.

## New concepts
For every Next.js, React, TypeScript, database or tooling idea used for the first
time in this project: what it is, explained simply, with a tiny example.
Link to the official docs page for further reading. Skip concepts already
explained in an earlier note — link to that note instead.

## How it works
Walk through the flow step by step (e.g. "buyer clicks Place order → server action
in src/app/store/[slug]/checkout/actions.ts → placeOrder() in
src/server/services/orders.ts → …"). A small Mermaid diagram is welcome when
the flow branches.

## Files changed
| File | What it does |
| --- | --- |
| `src/...` | One line each |

## Key code, explained
One to three short excerpts of the most important code, with a line-by-line
explanation in plain words.

## Try it yourself
Exact commands and clicks to see it working, and one small change the owner can
make to experiment (and how to undo it).

## Check your understanding
Three short questions, with answers in a collapsed <details> block.

## Words to know
Short glossary of new terms.
```

Writing rules for notes:

- Assume the reader knows basic JavaScript and HTML but **not** Next.js, React Server Components, TypeScript generics, SQL, Drizzle or Docker. Explain those the first time they appear.
- Plain English, short sentences, concrete examples from this codebase rather than generic ones.
- Explain *why* a choice was made, not only *what* the code does.
- Keep each note focused: 1–3 pages.

### 2.3 Explain commands

When you run a command the owner hasn't seen before (`pnpm`, `docker compose`, `drizzle-kit`, `git rebase`, etc.), say in one line what it does and why.

### 2.4 Code comments

Add short comments where the *why* isn't obvious (business rules, security decisions, Sri Lanka-specific behaviour). Don't comment obvious code. Reference the spec section when a rule comes from it, e.g. `// SPEC 7.5: stock is decremented inside the order transaction`.

### 2.5 End of each working session

Finish with a short chat summary: what was done (with commit list), what's next, anything waiting on the owner, and which learning notes to read.

---

## 3. When unsure

- Business or product question → ask the owner; meanwhile use the spec's placeholder.
- Technical choice the spec doesn't cover → pick the simplest correct option, record it in `docs/DECISIONS.md`, and mention it in the learning note.
- Never delete files, rewrite git history on shared branches, or force-push without asking.
