import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { shops, users } from "@/server/db/schema";
import { TENANT_ROLE, withShop } from "@/server/db/tenant";
import { INSUFFICIENT_PRIVILEGE, pgErrorCode } from "./fixtures";

/** Runs `fn` as the tenant role but WITHOUT setting a shop, like a buggy code path would. */
function asTenantRoleWithoutShop<T>(fn: Parameters<typeof db.transaction<T>>[0]) {
  return db.transaction(async (tx) => {
    await tx.execute(sql.raw(`set local role ${TENANT_ROLE}`));
    return fn(tx);
  });
}

describe("tenant role safety", () => {
  it("sees no shops at all when no shop is set", async () => {
    const rows = await asTenantRoleWithoutShop((tx) => tx.select({ id: shops.id }).from(shops));
    expect(rows).toEqual([]);
  });

  it("can't read the users table (no grant)", async () => {
    await expect(
      asTenantRoleWithoutShop((tx) => tx.select({ id: users.id }).from(users)),
    ).rejects.toSatisfy((error) => pgErrorCode(error) === INSUFFICIENT_PRIVILEGE);
  });

  it("rejects a shop id that isn't a UUID before touching the database", async () => {
    await expect(withShop("abc-fashion", async () => "never runs")).rejects.toThrow(
      /not a valid shop id/,
    );
  });

  it("doesn't leak the shop setting or role past the transaction", async () => {
    await withShop("0192f5c4-7b2e-7000-8000-000000000001", async () => undefined);

    const [after] = await db.execute<{ shop: string | null; role: string }>(
      sql`select nullif(current_setting('app.shop_id', true), '') as shop, current_user as role`,
    );
    expect(after.shop).toBeNull();
    expect(after.role).not.toBe(TENANT_ROLE);
  });
});
