/**
 * Test data for integration tests. Uses the plain `db` client (table owner) to set
 * up and clean up, because creating shops isn't a tenant-scoped operation.
 * Every fixture gets a random suffix, so test files can run in parallel and never
 * touch your own development data.
 */
import { inArray } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { v7 as uuidv7 } from "uuid";
import { db } from "@/server/db";
import { shopCounters, shopMembers, shops, subscriptions, users } from "@/server/db/schema";

export type TestShop = Awaited<ReturnType<typeof createTestShop>>;

export async function createTestShop(label: string) {
  const suffix = uuidv7().slice(-12); // the random part of a UUID v7

  const [user] = await db
    .insert(users)
    .values({ name: `Test owner ${label}`, email: `${label}-${suffix}@phone.invalid` })
    .returning();
  const [shop] = await db
    .insert(shops)
    .values({ ownerId: user.id, slug: `test-${label}-${suffix}`, name: `Test shop ${label}` })
    .returning();
  await db.insert(shopMembers).values({ shopId: shop.id, userId: user.id });
  await db.insert(shopCounters).values({ shopId: shop.id });
  await db.insert(subscriptions).values({ shopId: shop.id });

  return { user, shop };
}

/** Deletes the shops (members, counters and subscriptions cascade) and their owners. */
export async function deleteTestShops(...fixtures: TestShop[]) {
  if (fixtures.length === 0) return;
  await db.delete(shops).where(
    inArray(
      shops.id,
      fixtures.map((f) => f.shop.id),
    ),
  );
  await db.delete(users).where(
    inArray(
      users.id,
      fixtures.map((f) => f.user.id),
    ),
  );
}

/** The Postgres error code behind a failed query, e.g. "42501" (insufficient privilege). */
export function pgErrorCode(error: unknown): string | undefined {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  return (cause as { code?: string } | undefined)?.code;
}

/** Postgres raises 42501 both for RLS "new row violates policy" and "permission denied". */
export const INSUFFICIENT_PRIVILEGE = "42501";
