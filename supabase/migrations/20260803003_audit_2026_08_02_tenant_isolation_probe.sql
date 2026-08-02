-- Audit 2026-08-02 — behavioural tenant-isolation probe.
--
-- Why this exists: scripts/check-supabase-rls-contracts.mjs asserts that RLS is
-- ENABLED and that policies EXIST. It passed green the entire time production
-- was leaking 2,410 org_members rows across 2,309 organisations, because a
-- policy that is present and permissive is indistinguishable from a policy that
-- is present and correct when you only inspect the catalog. Supabase's own
-- security advisor missed it for the same reason.
--
-- The only reliable detection is to authenticate as a real tenant and count what
-- comes back. This function does exactly that, server-side, so CI can assert on
-- behaviour instead of shape.
--
-- Two design constraints worth recording:
--
--   * SECURITY INVOKER, not DEFINER. Postgres forbids SET ROLE inside a
--     SECURITY DEFINER function, and this function must switch to the
--     `authenticated` role for RLS to apply at all. EXECUTE is granted only to
--     service_role, so the invoker is always trusted server-side code.
--
--   * The table list is materialised into arrays BEFORE the role switch. A temp
--     table would not be readable after SET ROLE authenticated without an
--     explicit grant, which silently turns every probe into an error row.
--
-- Probing several roles matters: the org_audit_logs leak was reachable only as
-- admin/manager/compliance_officer, so an owner-only probe reported that table
-- as correctly isolated. A single-role sweep cannot clear a schema whose
-- policies branch on role.

CREATE OR REPLACE FUNCTION public._audit_tenant_isolation_probe()
RETURNS TABLE (
  probe_role text,
  probe_user uuid,
  table_name text,
  org_column text,
  visible_orgs integer,
  verdict text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tables text[];
  v_cols   text[];
  v_roles  text[] := ARRAY['owner', 'admin', 'manager', 'compliance_officer', 'member'];
  v_role   text;
  v_user   uuid;
  v_orgs   integer;
  i        integer;
  v_caller text := current_user;
BEGIN
  -- Materialise the scan list while still running as the (privileged) caller.
  SELECT array_agg(t.tbl ORDER BY t.tbl), array_agg(t.col ORDER BY t.tbl)
    INTO v_tables, v_cols
  FROM (
    SELECT c.relname::text AS tbl,
           (SELECT col.column_name
              FROM information_schema.columns col
             WHERE col.table_schema = 'public'
               AND col.table_name = c.relname
               AND col.column_name IN ('organization_id', 'org_id')
             ORDER BY col.column_name
             LIMIT 1)::text AS col
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relrowsecurity
       AND EXISTS (
         SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public'
            AND col.table_name = c.relname
            AND col.column_name IN ('organization_id', 'org_id')
       )
  ) t;

  IF v_tables IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_role IN ARRAY v_roles LOOP
    -- Restore the ORIGINAL caller role rather than RESET ROLE: under PostgREST
    -- the session role is `authenticator`, so RESET ROLE dropped privileges
    -- after the first iteration and the next probe-user lookup failed with
    -- "permission denied for table org_members".
    EXECUTE format('SET LOCAL ROLE %I', v_caller);

    -- A probe user must belong to exactly ONE organisation, otherwise "more
    -- than one org visible" is legitimate and the signal is meaningless.
    SELECT om.user_id INTO v_user
      FROM org_members om
     WHERE om.role = v_role
       AND (SELECT count(*) FROM org_members x WHERE x.user_id = om.user_id) = 1
     LIMIT 1;

    CONTINUE WHEN v_user IS NULL;

    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_user::text, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    FOR i IN 1 .. array_length(v_tables, 1) LOOP
      BEGIN
        EXECUTE format('SELECT count(DISTINCT %I) FROM public.%I', v_cols[i], v_tables[i])
          INTO v_orgs;

        probe_role := v_role;
        probe_user := v_user;
        table_name := v_tables[i];
        org_column := v_cols[i];
        visible_orgs := v_orgs;
        verdict := CASE WHEN coalesce(v_orgs, 0) > 1 THEN 'LEAK' ELSE 'OK' END;
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        -- An erroring policy is a defect too: a policy that raises instead of
        -- returning false aborts the caller's whole query. team_invitations
        -- was failing this way (it read auth.users, which authenticated cannot
        -- select) and no catalog check could see it.
        probe_role := v_role;
        probe_user := v_user;
        table_name := v_tables[i];
        org_column := v_cols[i];
        visible_orgs := NULL;
        verdict := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END LOOP;
  END LOOP;

  EXECUTE format('SET LOCAL ROLE %I', v_caller);
  PERFORM set_config('request.jwt.claims', NULL, true);
END;
$$;

REVOKE ALL ON FUNCTION public._audit_tenant_isolation_probe() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._audit_tenant_isolation_probe() TO service_role;
