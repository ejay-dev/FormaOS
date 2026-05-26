-- Audit 2026-05-26 — P0-1: enforce append-only invariant on audit tables at the
-- RLS layer.
--
-- Background: the audit chain (`audit_log`) and the primary org audit table
-- (`org_audit_logs`) were append-only by application convention, not by policy.
-- The existing `org_audit_logs_unified` policy is FOR ALL (permissive) gated on
-- org membership, which means any org member could UPDATE or DELETE rows in
-- their own org's audit log. The sequence-number check in
-- verifyChainIntegrity() catches mid-chain deletion of `audit_log` rows, but
-- targeted in-place UPDATEs that recompute the hash would not be detected
-- without external comparison.
--
-- Fix: add RESTRICTIVE deny policies on UPDATE and DELETE for every audit
-- table. Restrictive policies AND with permissive ones, so this blocks
-- mutation/deletion from all non-bypass roles regardless of what other
-- policies exist. Service role + SECURITY DEFINER RPCs (audit_log_append)
-- still bypass RLS, so writes from the legitimate code path are unaffected.
--
-- Tables locked:
--   * public.audit_log              (hash-chained primary)
--   * public.org_audit_log          (singular baseline table)
--   * public.org_audit_logs         (plural production table — FOR ALL hole)
--   * public.admin_audit_log        (platform admin actions)
--   * public.security_audit_log     (security event log)

DO $$
DECLARE
  t_name text;
  audit_tables text[] := ARRAY[
    'audit_log',
    'org_audit_log',
    'org_audit_logs',
    'admin_audit_log',
    'security_audit_log'
  ];
BEGIN
  FOREACH t_name IN ARRAY audit_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = t_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t_name);

      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        t_name || '_no_update', t_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false)',
        t_name || '_no_update', t_name
      );

      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        t_name || '_no_delete', t_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE USING (false)',
        t_name || '_no_delete', t_name
      );

      RAISE NOTICE 'Locked % to append-only via RESTRICTIVE UPDATE/DELETE deny.', t_name;
    ELSE
      RAISE NOTICE 'Skipping %: table does not exist in this database.', t_name;
    END IF;
  END LOOP;
END $$;

-- Post-condition: every audit table that exists must have both a
-- *_no_update and *_no_delete restrictive policy.
DO $$
DECLARE
  t_name text;
  missing text[] := ARRAY[]::text[];
  audit_tables text[] := ARRAY[
    'audit_log',
    'org_audit_log',
    'org_audit_logs',
    'admin_audit_log',
    'security_audit_log'
  ];
BEGIN
  FOREACH t_name IN ARRAY audit_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = t_name
    ) THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = t_name
         AND policyname = t_name || '_no_update'
         AND permissive = 'RESTRICTIVE'
    ) THEN
      missing := array_append(missing, t_name || '_no_update');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = t_name
         AND policyname = t_name || '_no_delete'
         AND permissive = 'RESTRICTIVE'
    ) THEN
      missing := array_append(missing, t_name || '_no_delete');
    END IF;
  END LOOP;

  IF array_length(missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Audit-table append-only enforcement is incomplete. Missing restrictive policies: %', missing;
  END IF;
END $$;
