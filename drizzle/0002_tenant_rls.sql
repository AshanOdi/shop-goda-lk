-- Row Level Security for tenant tables, SPEC 5.6.

-- The shop the current transaction works for, set by withShop() with
-- set_config('app.shop_id', <id>, true). Returns NULL when it isn't set, and
-- `shop_id = NULL` matches no rows, so a missing shop context sees nothing.
CREATE OR REPLACE FUNCTION app_current_shop_id() RETURNS uuid
  LANGUAGE sql
  STABLE
  AS $$ SELECT nullif(current_setting('app.shop_id', true), '')::uuid $$;
--> statement-breakpoint

-- shops: the tenant itself, matched on its own id.
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY shops_tenant_isolation ON shops
  FOR ALL TO apekade_app
  USING (id = app_current_shop_id())
  WITH CHECK (id = app_current_shop_id());
--> statement-breakpoint

-- Tables with a shop_id. USING decides which existing rows are visible (and can be
-- updated or deleted); WITH CHECK decides which new or changed rows may be written.
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY shop_members_tenant_isolation ON shop_members
  FOR ALL TO apekade_app
  USING (shop_id = app_current_shop_id())
  WITH CHECK (shop_id = app_current_shop_id());
--> statement-breakpoint

ALTER TABLE shop_counters ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY shop_counters_tenant_isolation ON shop_counters
  FOR ALL TO apekade_app
  USING (shop_id = app_current_shop_id())
  WITH CHECK (shop_id = app_current_shop_id());
--> statement-breakpoint

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
  FOR ALL TO apekade_app
  USING (shop_id = app_current_shop_id())
  WITH CHECK (shop_id = app_current_shop_id());
