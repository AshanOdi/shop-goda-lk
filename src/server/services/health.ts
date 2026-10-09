import { sql } from "drizzle-orm";
import { db } from "@/server/db";

/** True when the database answers a trivial query. */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
