/**
 * Sellers and platform admins. Used by Better Auth for login (SPEC 6.1).
 */
// Matches better-auth 1.7 + phone-number plugin: property names (emailVerified,
// phoneNumber...) must match Better Auth's field names; column names are ours.
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_columns";

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  // Better Auth requires an email. Phone-only sellers get a placeholder ending in
  // "@phone.invalid" (see DECISIONS.md) until they add a real one.
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // SPEC 5.2: E.164, e.g. +94771234567
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  ...timestamps,
});
