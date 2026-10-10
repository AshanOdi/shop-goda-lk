# 003 — Local database, Drizzle and environment variables

**Milestone:** M0 · **Branch:** m0/database · **Commits:**
`chore: add docker compose for local postgres` ·
`feat: add zod-validated environment variables` ·
`feat(db): add drizzle client and database health check` ·
`docs: record database setup decisions`

## What we built

A PostgreSQL database that runs on your laptop inside Docker, a connection from the app to it using Drizzle, a file that checks all settings (environment variables) when the app starts, and a `/api/health` URL that says whether the database is reachable.

## Why it matters

Every shop, product and order will be stored in Postgres. Running the same database locally that production uses (Supabase is Postgres) means what works on your laptop works live. Checking settings at startup means a missing `DATABASE_URL` shows a clear error immediately, not a confusing crash when the first buyer places an order.

## New concepts

### Docker and Docker Compose

**Docker** runs software in an isolated box called a **container**, so you don't install Postgres on Windows/WSL directly. An **image** (`postgres:17-alpine`) is the recipe; a container is a running copy of it.

**Docker Compose** describes the containers a project needs in one file (`compose.yaml`):

```yaml
services:
  postgres:
    image: postgres:17-alpine # which software and version
    ports:
      - "5432:5432" # laptop port : container port
    volumes:
      - postgres-data:/var/lib/postgresql/data # keep data when the container restarts
```

- `docker compose up -d` starts everything in the background (`-d` = detached).
- `docker compose ps` shows what's running.
- `docker compose down` stops it (data kept). `docker compose down -v` stops it **and deletes the data**.

### Environment variables and `.env.local`

Settings that differ between laptop, staging and production (database address, API keys) are **environment variables**, read in code as `process.env.NAME`. Locally they live in `.env.local`, which Next.js loads automatically. `.env.local` holds secrets, so `.gitignore` keeps it out of git. `.env.example` is the committed template listing every key with no secrets.

### Validating with zod

**zod** describes what data should look like and checks it:

```ts
const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  TRIAL_DAYS: z.coerce.number().int().positive().default(14),
});
```

`z.coerce.number()` turns the text `"14"` into the number `14` (env values are always text). `.default(14)` fills it in when missing. `z.infer<typeof envSchema>` gives a TypeScript type for free, so `env.TRIAL_DAYS` is known to be a `number`. We'll reuse zod for every form and server action (SPEC 3). Docs: https://zod.dev

### ORM and Drizzle

An **ORM** lets you write database queries in TypeScript instead of SQL strings, with types checked. Express projects often use Mongoose (MongoDB) or Sequelize; we use **Drizzle**. It stays close to SQL, so you also learn SQL:

```ts
// SQL:     SELECT * FROM products WHERE shop_id = $1
// Drizzle: db.select().from(products).where(eq(products.shopId, shopId))
```

- **Schema** (`src/server/db/schema/`): tables written as TypeScript (from M1).
- **drizzle-kit**: the command-line tool. `pnpm db:generate` compares the schema to the last migration and writes a new SQL **migration** file into `drizzle/`. `pnpm db:migrate` runs those files against the database. `pnpm db:studio` opens a browser view of your tables.
- **Migration**: a numbered SQL file that changes the database step by step. They're committed, so every developer's and every server's database ends up with the same structure.

### Connection pool and the `globalThis` trick

Opening a database connection is slow, so `postgres(...)` keeps a **pool** of open connections and reuses them. In development, `next dev` re-runs files every time you save, which would create a new pool each time. Storing the pool on `globalThis`, an object that survives those reloads, means we create it once:

```ts
const client = globalForDb.pgClient ?? postgres(env.DATABASE_URL, { prepare: false });
if (env.NODE_ENV !== "production") globalForDb.pgClient = client;
```

`??` means "use the left side unless it's `null` or `undefined`".

### Route Handlers and `connection()`

`src/app/api/health/route.ts` is a **Route Handler**, Next.js's version of an Express route. Exporting `GET` handles `GET /api/health`. With Cache Components on (note 001), Next.js tries to run `GET` handlers at **build time** and save the result. `await connection()` says "always run this when a request arrives", which a health check must do.

## How it works

`pnpm dev` → Next.js loads `.env.local` into `process.env` → the first request to `/api/health` imports the route → that imports `services/health.ts` → `server/db/index.ts` → `env.ts`, which validates every variable (and throws a readable error if something is wrong) → postgres.js connects to `localhost:5432` (the Docker container) → `select 1` → `{"status":"ok"}`.

The layers follow CLAUDE.md: **route → service → db**. Routes and pages never import `server/db` directly.

## Files changed

| File | What it does |
| --- | --- |
| `compose.yaml` | Runs Postgres 17 in Docker for local development |
| `.env.example` | Template of every environment variable (SPEC 16) |
| `src/env.ts` | Validates environment variables at startup; exports a typed `env` |
| `tests/unit/env.test.ts` | Proves required/optional/default behaviour of `env.ts` |
| `vitest.config.mts` | Gives tests the two required variables |
| `drizzle.config.ts` | Tells drizzle-kit where the schema, migrations and database are |
| `src/server/db/index.ts` | Creates the Drizzle client (one pool, reused) |
| `src/server/db/schema/index.ts` | Where table definitions will be exported from (empty for now) |
| `src/server/services/health.ts` | `isDatabaseReachable()`: the service the route calls |
| `src/app/api/health/route.ts` | `GET /api/health` |
| `package.json` | New dependencies; `db:generate`, `db:migrate`, `db:studio` scripts |

## Key code, explained

```ts
export function parseEnv(source: Record<string, string | undefined>): Env {
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = envSchema.safeParse(present);
  if (!result.success) {
    throw new Error(`Invalid environment variables (see .env.example):\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
```

- `Record<string, string | undefined>`: "an object whose keys are strings and values are strings or undefined", which is the shape of `process.env`.
- The `filter` drops empty values: a line `RESEND_API_KEY=` in `.env.local` gives `""`, which we treat as "not set".
- `safeParse` returns `{ success, data | error }` instead of throwing, so we can build our own message.
- `z.prettifyError` lists every problem at once, like `✖ must be at least 32 characters → at BETTER_AUTH_SECRET`.

## Try it yourself

1. With Docker running, open http://localhost:3000/api/health and look for `{"status":"ok"}`.
2. Run `docker compose stop` and refresh: you get `503` and `"database":"unreachable"`. Start it again with `docker compose start`.
3. In `.env.local`, change `BETTER_AUTH_SECRET` to `abc`, then restart `pnpm dev` and open the health URL. The terminal shows the validation error naming the variable. Undo the change.
4. Peek inside the database: `docker compose exec postgres psql -U apekade` then `\l` (list databases) and `\q` (quit).

## Check your understanding

1. Why is `.env.local` not committed, but `.env.example` is?
2. What's the difference between `docker compose down` and `docker compose down -v`?
3. Why does the health route call `connection()`?

<details>
<summary>Answers</summary>

1. `.env.local` contains real secrets; `.env.example` only lists the names, so new developers know what to set.
2. `-v` also deletes the volume, which means all the data in your local database.
3. So Next.js runs it on every request instead of trying to prerender it at build time, when there may be no database.

</details>

## Words to know

- **Container / image**: a running isolated program / the recipe it's made from.
- **Volume**: Docker storage that survives container restarts.
- **Environment variable**: a setting passed to the app from outside the code.
- **Schema validation**: checking data has the expected shape and types (zod).
- **ORM**: a library for querying the database from typed code (Drizzle).
- **Migration**: a versioned SQL file that changes the database structure.
- **Connection pool**: a set of reusable open database connections.
- **Route Handler**: a `route.ts` file that answers HTTP requests, like an Express route.
