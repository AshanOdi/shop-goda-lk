/**
 * Logged-in sessions (Better Auth). One row per signed-in device.
 */
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id, timestamps, timestamptz } from "./_columns";
import { users } from "./users";

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    expiresAt: timestamptz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);
