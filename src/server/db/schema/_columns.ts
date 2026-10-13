/**
 * Column helpers shared by every table (SPEC 6: id, created_at, updated_at).
 */
import { timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

/** SPEC 5.4: UUID v7 primary keys. They start with a timestamp, so new rows sort last. */
export const id = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7());

/** SPEC 5.5: timestamps are timestamptz, stored in UTC. */
export const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const timestamps = {
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
