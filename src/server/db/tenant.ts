/**
 * withShop(): the ONLY way to query tenant tables (CLAUDE.md, SPEC 5.6).
 *
 * It opens a transaction, tells Postgres which shop the work is for, and switches
 * to the restricted `apekade_app` role. Row Level Security policies (migration
 * 0002) then only let the callback see and change that shop's rows.
 *
 * Services should still filter by shop_id in their queries; RLS is the second guard
 * that holds even if a query forgets.
 */
import { sql } from "drizzle-orm";
import { db } from "./index";

/** The transaction object passed to the withShop callback. */
export type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Postgres role without BYPASSRLS, created in migration 0001. */
export const TENANT_ROLE = "apekade_app";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withShop<T>(shopId: string, fn: (tx: TenantTx) => Promise<T>): Promise<T> {
  if (!UUID.test(shopId)) {
    throw new Error(`withShop: "${shopId}" is not a valid shop id`);
  }

  return db.transaction(async (tx) => {
    // `true` makes the setting local to this transaction. With a connection pooler
    // the same connection serves other requests next, so a session-wide setting
    // could leak one shop's context into another shop's request.
    await tx.execute(sql`select set_config('app.shop_id', ${shopId}, true)`);
    // Also transaction-local. Our login role may bypass RLS (it owns the tables, or
    // is a superuser locally); apekade_app never does.
    await tx.execute(sql.raw(`set local role ${TENANT_ROLE}`));
    return fn(tx);
  });
}
