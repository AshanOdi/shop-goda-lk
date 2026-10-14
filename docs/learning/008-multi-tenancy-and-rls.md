# 008 — Multi-tenancy and Row Level Security

**Milestone:** M1 · **Branch:** m1/tenancy-rls · **Commits:**
`feat(db): add withShop tenant transaction helper` ·
`feat(db): add tenant role and row level security migrations` ·
`test: allow DATABASE_URL override for integration tests` ·
`test(db): add integration test fixtures` ·
`test(db): prove shops can't read each other's data` ·
`test(db): prove shops can't change each other's data` ·
`test(db): check the tenant role fails closed` ·
`test(db): require rls on every tenant table` ·
`docs: document tenant table rules in claude.md` ·
`docs: record tenancy and rls decisions` ·
`docs: update progress for m1 task 2`

## What we built

A guarantee, enforced by the database itself, that one shop can never read or change another shop's data. Code that works with a shop's data runs inside `withShop(shopId, ...)`, and Postgres Row Level Security hides every row that belongs to a different shop. Integration tests against a real Postgres prove it, including a test that fails if a future table forgets the protection.

## Why it matters

All shops share the same tables. Without this, one missing `where shop_id = ...` in one query could show ABC Fashion's customers (names, phones, addresses) to another seller. That would be a privacy breach under Sri Lanka's PDPA and the end of sellers' trust.

## New concepts

### Multi-tenancy

One app and one database serve many customers (**tenants**). For us a tenant is a shop. The alternative, one database per shop, is much harder to run. Shared tables are standard, but every row must say whose it is (`shop_id`) and every query must respect that.

### Defence in depth

Two independent guards:

1. **App code:** services filter by `shop_id` and take `shopId` as their first argument.
2. **Database:** RLS policies filter rows even if the app forgets.

Either one alone could fail. Both failing at once is far less likely.

### Database roles and privileges

A Postgres **role** is an account with permissions. **Privileges** (`GRANT SELECT ON shops TO ...`) say which tables a role may use. Two kinds of roles skip RLS entirely: **superusers** (our local `apekade` user) and **table owners**. So we created a separate role:

```sql
CREATE ROLE apekade_app NOLOGIN NOBYPASSRLS;
GRANT apekade_app TO CURRENT_USER;                 -- our login may switch into it
GRANT SELECT, INSERT, UPDATE, DELETE ON shops, shop_members, shop_counters, subscriptions TO apekade_app;
```

- `NOLOGIN`: no one can connect as it; we only switch into it.
- `NOBYPASSRLS`: RLS always applies.
- It has no grant on `users`/`sessions`, so tenant code can't even read them. That's **least privilege**: give each part of the system only the access it needs.

### Row Level Security and policies

RLS adds an invisible `WHERE` to every query on a table:

```sql
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_members_tenant_isolation ON shop_members
  FOR ALL TO apekade_app                         -- every command, for this role
  USING (shop_id = app_current_shop_id())        -- which existing rows are visible
  WITH CHECK (shop_id = app_current_shop_id());  -- which new/changed rows may be written
```

- **`USING`** filters `SELECT`, and which rows `UPDATE`/`DELETE` can touch. Rows from other shops are invisible, so updating them affects 0 rows.
- **`WITH CHECK`** validates rows being written. Inserting a row for another shop, or moving your row into another shop, fails with error `42501` ("new row violates row-level security policy").

### Session variables: `set_config` and `current_setting`

Postgres lets a connection store custom settings. `withShop` stores the shop id:

```sql
select set_config('app.shop_id', '0192f5c4-...', true);   -- true = only for this transaction
```

and the policy reads it through a small SQL function:

```sql
CREATE FUNCTION app_current_shop_id() RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.shop_id', true), '')::uuid $$;
```

`current_setting(..., true)` returns NULL instead of erroring when unset, and `nullif(x, '')` turns an empty value into NULL. `shop_id = NULL` is never true, so **no shop set = no rows**.

### Transaction-local settings and connection pooling

Note 006: the Supabase pooler hands the same database connection to the next request, which may be for another shop. `set_config(..., true)` and `SET LOCAL ROLE` both reset when the transaction ends. A session-wide setting would survive and leak one shop's context into the next request. This is why `withShop` always opens a transaction.

### Fail closed

When something goes wrong, end up in the safe state. A code path that forgets to set the shop sees **nothing**, rather than **everything**. It's a bug either way, but not a data leak.

### Custom SQL migrations

Drizzle's schema files describe tables and columns well, but not roles, grants, functions or policies. `pnpm db:generate --custom --name=...` creates an empty migration file (registered in `drizzle/meta/_journal.json`) for hand-written SQL. `--> statement-breakpoint` separates statements so drizzle-kit runs them one by one.

### `DO $$ ... $$` blocks

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'apekade_app') THEN
    CREATE ROLE apekade_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
```

A small piece of procedural code (PL/pgSQL) run once. Roles belong to the whole Postgres server, not one database, so we only create it if it isn't there yet. `$$` is a quote marker that lets the body contain `'` freely.

### Integration tests and fixtures

**Integration tests** check that pieces work together: our code, Drizzle and a real Postgres with real policies. **Fixtures** are the test data they need. `createTestShop()` makes a user, shop, member, counter and subscription with a random suffix, so test files can run in parallel and never touch your own data; `deleteTestShops()` cleans up.

`beforeAll` / `afterAll` run once before and after the tests in a `describe` block.

### Testing the tests (mutation testing, by hand)

To check the tests really catch problems, we temporarily turned off RLS on `shop_members` in a throwaway database: 4 tests failed. A test that can't fail proves nothing.

## How it works

Service code calls `withShop(shopId, (tx) => ...)` → validates `shopId` is a UUID → `db.transaction` begins → `set_config('app.shop_id', shopId, true)` → `SET LOCAL ROLE apekade_app` → the callback's queries run; Postgres adds `shop_id = app_current_shop_id()` to each → commit (or rollback on error) → the setting and role reset.

Not everything is tenant-scoped. Better Auth (users, sessions), creating a new shop, looking up a shop by its slug and platform admin use the plain `db` connection (the owner, which RLS doesn't restrict). These are few and deliberate.

## Files changed

| File | What it does |
| --- | --- |
| `src/server/db/tenant.ts` | `withShop()`, `TenantTx`, `TENANT_ROLE` |
| `drizzle/0001_tenant_role.sql` | Creates `apekade_app`, grants on tenant tables |
| `drizzle/0002_tenant_rls.sql` | `app_current_shop_id()`, RLS on + policies for 4 tables |
| `drizzle/meta/*` | Journal and snapshots for the two custom migrations |
| `tests/integration/fixtures.ts` | Test shops, cleanup, `pgErrorCode()` |
| `tests/integration/tenant-reads.test.ts` | A can't see B's rows |
| `tests/integration/tenant-writes.test.ts` | A can't update/delete/insert B's rows; A can update its own |
| `tests/integration/tenant-role.test.ts` | No shop set → nothing visible; no access to `users`; no leaks after commit |
| `tests/integration/rls-coverage.test.ts` | Every table with `shop_id` must have RLS, a policy and a grant |
| `vitest.config.mts` | `DATABASE_URL` can be overridden |
| `CLAUDE.md` | Rule for new tenant tables |

## Key code, explained

```ts
it("can't insert a row for another shop", async () => {
  await expect(
    withShop(a.shop.id, (tx) =>
      tx.insert(shopMembers).values({ shopId: b.shop.id, userId: a.user.id }),
    ),
  ).rejects.toSatisfy((error) => pgErrorCode(error) === INSUFFICIENT_PRIVILEGE);
});
```

- We run as shop A and try to add a member to shop B.
- `expect(promise).rejects` waits for the promise to fail; `.toSatisfy(fn)` checks the error with our own function.
- `pgErrorCode` digs the Postgres code out of Drizzle's `DrizzleQueryError` (`error.cause.code`). `42501` = insufficient privilege, which is what the `WITH CHECK` policy raises.
- Checking the exact code matters: a typo in the query would also "reject", but with a different code, and the test would correctly fail.

## Try it yourself

```bash
docker compose up -d
pnpm db:migrate
pnpm test
```

Then see RLS in plain SQL (`psql` inside the container):

```bash
docker compose exec postgres psql -U apekade
```

```sql
INSERT INTO users (id, name, email) VALUES ('0192f5c4-0000-7000-8000-000000000001', 'Demo', 'demo@phone.invalid');
INSERT INTO shops (id, owner_id, slug, name) VALUES ('0192f5c4-0000-7000-8000-0000000000aa', '0192f5c4-0000-7000-8000-000000000001', 'demo-shop', 'Demo');

BEGIN;
SET LOCAL ROLE apekade_app;
SELECT count(*) FROM shops;                       -- 0: no shop set, fail closed
SELECT set_config('app.shop_id', '0192f5c4-0000-7000-8000-0000000000aa', true);
SELECT slug FROM shops;                           -- demo-shop only
SELECT * FROM users;                              -- ERROR: permission denied
ROLLBACK;

DELETE FROM shops WHERE slug = 'demo-shop';
DELETE FROM users WHERE email = 'demo@phone.invalid';
\q
```

## Check your understanding

1. Why doesn't RLS apply to our local `apekade` login user, and how does `withShop` deal with that?
2. What's the difference between `USING` and `WITH CHECK`?
3. Why does `set_config` use `true` as its third argument?
4. You add a `products` table in M2 and forget RLS. What stops it reaching production?

<details>
<summary>Answers</summary>

1. It's a superuser (and owns the tables); both skip RLS. `withShop` switches to `apekade_app` with `SET LOCAL ROLE` inside the transaction.
2. `USING` filters which existing rows are visible or can be updated/deleted; `WITH CHECK` validates rows being inserted or changed.
3. To make the setting last only for the current transaction, so a pooled connection can't carry one shop's context into another shop's request.
4. `tests/integration/rls-coverage.test.ts` finds every table with a `shop_id` and fails if RLS, a policy or the grant is missing, so CI goes red.

</details>

## Words to know

- **Tenant / multi-tenancy**: a customer of a shared system / many tenants sharing one app and database.
- **Row Level Security (RLS)**: per-row access rules enforced by Postgres.
- **Policy**: one RLS rule (`USING`, `WITH CHECK`).
- **Role / privilege / GRANT**: a database account / a permission / giving a permission.
- **Least privilege**: only the access that's needed.
- **Fail closed**: an error leads to the safe state (no access).
- **Transaction-local**: lasts until the current transaction ends.
- **Integration test / fixture**: a test across real components / the data a test sets up.
