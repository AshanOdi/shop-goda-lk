/**
 * Shops (SPEC 6.1). `shops` is the tenant itself: every other tenant table
 * points to it with a `shop_id`.
 */
import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps, timestamptz } from "./_columns";
import { users } from "./users";

export const shopStatus = pgEnum("shop_status", ["active", "paused", "suspended"]);

export type BankDetails = {
  bank: string;
  branch: string;
  accountName: string;
  accountNumber: string;
};

export const shops = pgTable(
  "shops",
  {
    id: id(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    whatsapp: text("whatsapp"), // E.164
    email: text("email"),
    addressLine1: text("address_line1"),
    city: text("city"),
    district: text("district"), // one of the 25 districts (SPEC 5.3), checked in the app
    brandColor: text("brand_color"), // hex, e.g. #7a1f2b
    status: shopStatus("status").notNull().default("active"),
    bankDetails: jsonb("bank_details").$type<BankDetails>(),
    acceptsCod: boolean("accepts_cod").notNull().default(true),
    acceptsBankTransfer: boolean("accepts_bank_transfer").notNull().default(false),
    acceptsCard: boolean("accepts_card").notNull().default(false),
    payhereMerchantId: text("payhere_merchant_id"),
    // SPEC 7.7: AES-256-GCM encrypted; never sent to the client.
    payhereSecretEncrypted: text("payhere_secret_encrypted"),
    receiptFooter: text("receipt_footer"),
    onboardingCompletedAt: timestamptz("onboarding_completed_at"),
    ...timestamps,
  },
  (t) => [
    index("shops_owner_id_idx").on(t.ownerId),
    // SPEC 6.1: 3–30 characters of a-z, 0-9 and "-". The database enforces it too,
    // so no code path can ever save a bad slug. Reserved words are checked in the app.
    check("shops_slug_format", sql`${t.slug} ~ '^[a-z0-9-]{3,30}$'`),
  ],
);
