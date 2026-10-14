import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { TENANT_ROLE } from "@/server/db/tenant";

/**
 * A safety net for future migrations: any table with a shop_id column (plus the
 * shops table itself) must have RLS switched on, a policy, and be usable by the
 * tenant role. Forgetting this on a new table (products, orders...) fails CI.
 */
describe("RLS coverage", () => {
  it("protects every tenant table", async () => {
    const tables = await db.execute<{
      table: string;
      rls: boolean;
      policies: number;
      granted: boolean;
    }>(sql`
      select c.relname as table,
             c.relrowsecurity as rls,
             (select count(*)::int from pg_policies p
               where p.schemaname = 'public' and p.tablename = c.relname) as policies,
             has_table_privilege(${TENANT_ROLE}, c.oid, 'SELECT') as granted
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and (c.relname = 'shops' or exists (
          select 1 from information_schema.columns col
          where col.table_schema = 'public'
            and col.table_name = c.relname
            and col.column_name = 'shop_id'))
      order by c.relname
    `);

    expect(tables.map((t) => t.table)).toEqual(
      expect.arrayContaining(["shop_counters", "shop_members", "shops", "subscriptions"]),
    );
    for (const t of tables) {
      expect(t, `${t.table} must be protected by RLS`).toMatchObject({
        rls: true,
        granted: true,
      });
      expect(t.policies, `${t.table} needs at least one policy`).toBeGreaterThan(0);
    }
  });
});
