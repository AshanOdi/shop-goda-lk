import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { shopMembers, shops, subscriptions } from "@/server/db/schema";
import { withShop } from "@/server/db/tenant";
import {
  createTestShop,
  deleteTestShops,
  INSUFFICIENT_PRIVILEGE,
  pgErrorCode,
  type TestShop,
} from "./fixtures";

// SPEC 5.6: shop A must never change shop B's data.
describe("tenant isolation: writes", () => {
  let a: TestShop;
  let b: TestShop;

  beforeAll(async () => {
    a = await createTestShop("a");
    b = await createTestShop("b");
  });

  afterAll(() => deleteTestShops(a, b));

  it("can update its own shop (so the policies don't just block everything)", async () => {
    const updated = await withShop(a.shop.id, (tx) =>
      tx
        .update(shops)
        .set({ tagline: "Handmade bags" })
        .where(eq(shops.id, a.shop.id))
        .returning({ id: shops.id }),
    );
    expect(updated).toEqual([{ id: a.shop.id }]);
  });

  it("can't update another shop", async () => {
    const updated = await withShop(a.shop.id, (tx) =>
      tx
        .update(shops)
        .set({ name: "Hacked" })
        .where(eq(shops.id, b.shop.id))
        .returning({ id: shops.id }),
    );
    expect(updated).toEqual([]);

    const [shopB] = await db
      .select({ name: shops.name })
      .from(shops)
      .where(eq(shops.id, b.shop.id));
    expect(shopB.name).toBe("Test shop b");
  });

  it("can't delete another shop's subscription", async () => {
    const deleted = await withShop(a.shop.id, (tx) =>
      tx
        .delete(subscriptions)
        .where(eq(subscriptions.shopId, b.shop.id))
        .returning({ id: subscriptions.id }),
    );
    expect(deleted).toEqual([]);

    const remaining = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.shopId, b.shop.id));
    expect(remaining).toHaveLength(1);
  });

  it("can't insert a row for another shop", async () => {
    await expect(
      withShop(a.shop.id, (tx) =>
        tx.insert(shopMembers).values({ shopId: b.shop.id, userId: a.user.id }),
      ),
    ).rejects.toSatisfy((error) => pgErrorCode(error) === INSUFFICIENT_PRIVILEGE);
  });

  it("can't move its own row into another shop", async () => {
    await expect(
      withShop(a.shop.id, (tx) =>
        tx.update(shopMembers).set({ shopId: b.shop.id }).where(eq(shopMembers.shopId, a.shop.id)),
      ),
    ).rejects.toSatisfy((error) => pgErrorCode(error) === INSUFFICIENT_PRIVILEGE);
  });
});
