import { index, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamps, timestamptz } from "./_columns";

/** One-time codes (phone OTPs) while they are valid. */
export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamptz("expires_at").notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);
