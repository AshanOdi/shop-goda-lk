import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { shopCounters, shopMembers, shops, subscriptions } from "@/server/db/schema";
import { withShop } from "@/server/db/tenant";
import { createTestShop, deleteTestShops, type TestShop } from "./fixtures";

// SPEC 5.6: shop A must never read shop B's data.
describe("tenant isolation: reads", () => {
  let a: TestShop;
  let b: TestShop;

  beforeAll(async () => {
    a = await createTestShop("a");
    b = await createTestShop("b");
  });

  afterAll(() => deleteTestShops(a, b));

  it("sees only its own shop row", async () => {
    const rows = await withShop(a.shop.id, (tx) => tx.select({ id: shops.id }).from(shops));
    expect(rows).toEqual([{ id: a.shop.id }]);
  });

  it("can't find another shop even when asking for it by id", async () => {
    const rows = await withShop(a.shop.id, (tx) =>
      tx.select({ id: shops.id }).from(shops).where(eq(shops.id, b.shop.id)),
    );
    expect(rows).toEqual([]);
  });

  // Deliberately no `where shop_id = ...`: this proves RLS filters on its own.
  it("sees only its own members, counter and subscription without filtering", async () => {
    const seen = await withShop(a.shop.id, async (tx) => ({
      members: await tx.select({ shopId: shopMembers.shopId }).from(shopMembers),
      counters: await tx.select({ shopId: shopCounters.shopId }).from(shopCounters),
      subscriptions: await tx.select({ shopId: subscriptions.shopId }).from(subscriptions),
    }));

    expect(seen.members).toEqual([{ shopId: a.shop.id }]);
    expect(seen.counters).toEqual([{ shopId: a.shop.id }]);
    expect(seen.subscriptions).toEqual([{ shopId: a.shop.id }]);
  });
});
