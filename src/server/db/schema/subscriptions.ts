/**
 * The shop's plan: a 14-day trial, then Pro (SPEC 6.1, 7.6).
 */
import { pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps, timestamptz } from "./_columns";
import { shops } from "./shops";

export const subscriptionPlan = pgEnum("subscription_plan", ["trial", "pro"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
]);

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  shopId: uuid("shop_id")
    .notNull()
    .unique()
    .references(() => shops.id, { onDelete: "cascade" }),
  plan: subscriptionPlan("plan").notNull().default("trial"),
  status: subscriptionStatus("status").notNull().default("trialing"),
  trialEndsAt: timestamptz("trial_ends_at"),
  currentPeriodEnd: timestamptz("current_period_end"),
  payhereSubscriptionId: text("payhere_subscription_id"),
  ...timestamps,
});
