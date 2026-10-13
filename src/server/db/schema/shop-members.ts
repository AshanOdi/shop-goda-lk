/**
 * Who can manage a shop. Phase 1: only the owner; staff accounts come in Phase 3.
 */
import { index, pgEnum, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_columns";
import { shops } from "./shops";
import { users } from "./users";

export const shopMemberRole = pgEnum("shop_member_role", ["owner", "staff"]);

export const shopMembers = pgTable(
  "shop_members",
  {
    id: id(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: shopMemberRole("role").notNull().default("owner"),
    ...timestamps,
  },
  (t) => [
    unique("shop_members_shop_user_unique").on(t.shopId, t.userId),
    index("shop_members_user_id_idx").on(t.userId),
  ],
);
