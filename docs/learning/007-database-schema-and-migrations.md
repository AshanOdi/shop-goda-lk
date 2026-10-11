# 007 — Database schema and migrations: users, shops, subscriptions

**Milestone:** M1 · **Branch:** m1/accounts-schema · **Commits:**
`feat(db): add schema for users, shops and subscriptions` ·
`feat(db): add first migration` ·
`ci: apply database migrations before tests` ·
`docs: record accounts schema decisions`

## What we built

The first real tables in Ape Kade's database: the ones Better Auth needs to log sellers in (users, sessions, accounts, verification codes), plus shops, shop members, the per-shop order counter and subscriptions. We wrote them as TypeScript with Drizzle, generated our first SQL migration from that code, and applied it to the database.

## Why it matters

Every later feature stores its data here. A shop row is the "tenant" that every product, order and customer will belong to. Getting keys, uniqueness and constraints right now means the database itself refuses bad data, such as two shops with the same link or a member pointing at a shop that doesn't exist, even if application code has a bug.

## New concepts

### Tables, columns and types

A **table** is like a spreadsheet: each **row** is one record (one shop), each **column** is one field (its `slug`). Every column has a **type**:

| Drizzle | Postgres type | Holds |
| --- | --- | --- |
| `text()` | `text` | any string |
| `boolean()` | `boolean` | true / false |
| `integer()` | `integer` | whole numbers (and our `*_cents`) |
| `uuid()` | `uuid` | 128-bit ids like `0192f5c4-...` |
| `timestamp(..., { withTimezone: true })` | `timestamptz` | a moment in time, stored in UTC |
| `jsonb()` | `jsonb` | a JSON object (`bank_details`) |
| `pgEnum(...)` | enum | one of a fixed list (`active`/`paused`/`suspended`) |

### Reading a Drizzle table definition

```ts
export const shopMembers = pgTable(
  "shop_members", // the table name in Postgres
  {
    id: id(), // primary key (UUID v7)
    shopId: uuid("shop_id") // TS name shopId, column name shop_id
      .notNull() // a value is required
      .references(() => shops.id, { onDelete: "cascade" }), // foreign key
    role: shopMemberRole("role").notNull().default("owner"),
    ...timestamps, // created_at, updated_at
  },
  (t) => [
    unique("shop_members_shop_user_unique").on(t.shopId, t.userId), // no duplicates
    index("shop_members_user_id_idx").on(t.userId), // fast lookups
  ],
);
```

Each method in the chain adds one rule. That's called a **builder** or **fluent API**.

### Keys and constraints (rules the database enforces)

- **Primary key**: the column that uniquely identifies a row (`id`).
- **Foreign key** (`.references(...)`): "this value must exist in that other table". `shop_members.shop_id` must be a real `shops.id`.
  - `onDelete: "cascade"`: delete the shop → its member rows are deleted too.
  - `onDelete: "restrict"`: refuse to delete a user who still owns a shop.
- **Unique**: no two rows may share the value (`shops.slug`, or the pair `shop_id + user_id`).
- **`NOT NULL`**: a value is required.
- **Default**: the value used when none is given (`status` → `'active'`).
- **Check constraint**: any true/false rule. `slug ~ '^[a-z0-9-]{3,30}$'` (`~` = "matches regex") makes Postgres reject `ABC Fashion!` as a slug, whatever the app does.

**Why enforce rules in the database too?** App code has bugs and many code paths. The database is the last line of defence, which matters for "no order is ever lost".

### Index

An **index** is like a book's index: instead of reading every row to find the shops owned by user X, Postgres jumps straight to them. We index columns we search or join on (`user_id`, `owner_id`). Unique constraints create an index automatically.

### Enum

`pgEnum("shop_status", ["active", "paused", "suspended"])` creates a Postgres type that only accepts those values. TypeScript knows the list too, so `status: "pasued"` is a compile error.

### UUID v7 vs auto-increment ids

Auto-increment ids (`1, 2, 3…`) leak information ("we have 37 shops") and are guessable. UUIDs are random-looking 128-bit values. **Version 7** UUIDs start with a timestamp, so they still sort by creation time, which keeps indexes efficient. SPEC 5.4.

### `timestamptz` and UTC

We store moments in UTC (`timestamptz`) and only convert to `Asia/Colombo` when displaying (SPEC 5.5). Then "13:34" means the same moment for the server in Mumbai, CI in the US and a seller in Kandy.

### Migrations

The schema files describe the database we **want**. A **migration** is the SQL that gets an existing database **there**:

1. `pnpm db:generate`: drizzle-kit compares the schema files to its last snapshot and writes `drizzle/0000_<name>.sql` (`CREATE TABLE ...`) plus a snapshot in `drizzle/meta/`.
2. `pnpm db:migrate`: runs every migration the database hasn't run yet, and records it in a `__drizzle_migrations` table so it never runs twice.

Migrations are committed to git, and the same files run on your laptop, in CI and on Supabase, so every database has the same structure. **Never edit a migration that has already run somewhere.** Change the schema and generate a new one.

### Matching a library's schema (Better Auth)

Better Auth reads and writes tables it expects to look a certain way (`emailVerified`, `phoneNumber`...). We keep its **property names** but use our own **table and column names** (`users.email_verified`) and map them in the adapter config (task 4). Its phone-number plugin adds `phoneNumber` (unique) and `phoneNumberVerified` to users.

## How it works

`src/server/db/schema/*.ts` (TypeScript tables) → `pnpm db:generate` → `drizzle/0000_*.sql` (committed) → `pnpm db:migrate` → tables in Postgres (Docker locally, the service container in CI, Supabase on staging) → `src/server/db/index.ts` passes the same schema to `drizzle()`, so queries are typed: `db.select().from(shops)` returns objects with `slug: string`, `status: "active" | "paused" | "suspended"`.

## Files changed

| File | What it does |
| --- | --- |
| `src/server/db/schema/_columns.ts` | Shared `id()` (UUID v7), `timestamptz()`, `timestamps` helpers |
| `src/server/db/schema/auth.ts` | `users`, `sessions`, `accounts`, `verifications` (Better Auth) |
| `src/server/db/schema/shops.ts` | `shops`, `shop_members`, `shop_counters`, enums, slug check |
| `src/server/db/schema/subscriptions.ts` | `subscriptions` and its enums |
| `src/server/db/schema/index.ts` | Re-exports all tables |
| `drizzle/0000_*.sql`, `drizzle/meta/*` | First migration and drizzle-kit's snapshot (generated) |
| `.github/workflows/ci.yml` | Runs `pnpm db:migrate` before tests |
| `package.json` | Adds `uuid` |

## Key code, explained

```ts
export const timestamps = {
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
```

- An ordinary object holding two column definitions. `...timestamps` (the **spread operator**) copies both into every table, so we write them once (DRY).
- `.defaultNow()` is a database default: Postgres fills in `now()` on insert.
- `.$onUpdate(...)` is a Drizzle feature (the `$` marks "runs in our app, not in SQL"): whenever Drizzle updates a row, it sets `updated_at` to the current time.

## Try it yourself

```bash
pnpm db:studio
```

Open the link and click through the new tables. Then try the slug rule in SQL:

```bash
docker compose exec postgres psql -U apekade -c "\d shops"
```

`\d shops` describes the table: columns, indexes and the `shops_slug_format` check. Read the generated `drizzle/0000_*.sql` file too; it's the plain SQL behind our TypeScript.

## Check your understanding

1. What happens to a shop's `shop_members` rows when the shop is deleted? And to a user who still owns a shop?
2. Why is the slug rule written in the database and not only in the form?
3. You add a `tagline_si` column next week. Do you edit `0000_*.sql`?

<details>
<summary>Answers</summary>

1. Members are deleted too (`cascade`). Deleting the user is refused (`restrict`) while `shops.owner_id` points to them.
2. Any code path (a future admin tool, a bug, a script) could skip the form; the `CHECK` constraint makes the database reject bad slugs no matter what.
3. No. Change `shops.ts`, run `pnpm db:generate` to create `0001_*.sql`, and commit it.

</details>

## Words to know

- **Schema**: the structure of the database (tables, columns, rules).
- **Primary key / foreign key**: a row's unique id / a reference to another table's row.
- **Constraint**: a rule the database enforces (`NOT NULL`, `UNIQUE`, `CHECK`, foreign keys).
- **Cascade / restrict**: what happens to linked rows when a row is deleted.
- **Index**: a structure for finding rows fast.
- **Enum**: a type with a fixed list of allowed values.
- **Migration**: a versioned SQL change script.
- **UUID v7**: a time-ordered, unguessable 128-bit id.
