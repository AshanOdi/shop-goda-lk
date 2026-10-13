import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_columns";
import { shops } from "./shops";

/** SPEC 5.4: per-shop order number sequence, locked inside the order transaction. */
export const shopCounters = pgTable("shop_counters", {
  shopId: uuid("shop_id")
    .primaryKey()
    .references(() => shops.id, { onDelete: "cascade" }),
  nextOrderNumber: integer("next_order_number").notNull().default(10001),
  ...timestamps,
});
