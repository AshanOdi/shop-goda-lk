-- The restricted role used by withShop() (src/server/db/tenant.ts), SPEC 5.6.
-- NOLOGIN: nobody can connect as it directly; our login role switches into it
-- with SET LOCAL ROLE inside a transaction.
-- NOBYPASSRLS: Row Level Security always applies to it.
-- Roles belong to the whole Postgres server, not one database, so create it only
-- if it doesn't exist yet (e.g. a second database on the same server).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'apekade_app') THEN
    CREATE ROLE apekade_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
-- Allow the role running the app (and these migrations) to switch into it.
GRANT apekade_app TO CURRENT_USER;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO apekade_app;
--> statement-breakpoint
-- Tenant tables only. users, sessions, accounts and verifications stay off-limits.
-- Every new tenant table must be granted here in its own migration (CLAUDE.md).
GRANT SELECT, INSERT, UPDATE, DELETE
  ON shops, shop_members, shop_counters, subscriptions
  TO apekade_app;
