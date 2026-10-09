/**
 * The database client. Only services (src/server/services) import this; UI code never does.
 * Tenant tables must be queried through withShop() in ./tenant.ts once it exists (M1).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// `next dev` re-runs modules on every file change. Reuse one connection pool across
// reloads, or each save would open new connections until Postgres refuses more.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    // Supabase's transaction pooler (used in production) doesn't support prepared statements.
    prepare: false,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle({ client, schema });
