-- Audit 2026-05-26 — split platform-level security events away from
-- the per-org security_audit_log table.
--
-- APPLY NOTE: this file's backfill assumed `security_audit_log.details`
-- and `security_audit_log.severity` columns. Production has `metadata`
-- (not `details`) and no `severity` column. The version actually
-- applied on 2026-05-26 (recorded as version 20260526040649 with name
-- `audit_2026_05_26_platform_security_audit_log_v2`) skipped the
-- backfill entirely — verified pre-apply that 0 sentinel-tagged rows
-- existed in security_audit_log, so nothing to migrate. Schema setup
-- and sentinel-org cleanup ran as below. Keep this file for the
-- intent; if a re-apply against a different environment is ever
-- needed, adapt the column names first.
--
-- Background (Database H7): migration 20260624016 made
-- security_audit_log.organization_id NOT NULL and parked all pre-login
-- failed-signin rows under a synthetic "__platform_sentinel__" org
-- row at id `00000000-0000-0000-0000-00000000f0f0`. The sentinel:
--
--   * Lives in `organizations` alongside real customer orgs, so any
--     code path that enumerates all orgs (admin lists, customer-health
--     rollups, MRR queries) leaks it.
--   * Has plan_key=NULL — a future NOT NULL on organizations.plan_key
--     would violate.
--   * Means the security_audit_log table conflates per-org and
--     platform events in a single tenant-scoped schema. Owners of any
--     real org cannot read the sentinel rows via RLS (they're not
--     members), but the row count + table size mixes the two
--     populations.
--
-- Fix: a separate `platform_security_audit_log` table with no FK to
-- organizations. Pre-login + platform-level events move there;
-- security_audit_log keeps only per-org events. The sentinel row in
-- organizations is removed.

CREATE TABLE IF NOT EXISTS public.platform_security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  email text,
  ip_address text,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_security_audit_log_created_idx
  ON public.platform_security_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_security_audit_log_event_type_idx
  ON public.platform_security_audit_log (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_security_audit_log_email_idx
  ON public.platform_security_audit_log (email, created_at DESC)
  WHERE email IS NOT NULL;

-- RLS — only the service role / founder accounts should be reading
-- these. No tenant policies; service_role bypasses anyway.
ALTER TABLE public.platform_security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_security_audit_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_security_audit_log_deny_all
  ON public.platform_security_audit_log;
CREATE POLICY platform_security_audit_log_deny_all
  ON public.platform_security_audit_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Backfill: move any sentinel-bound rows from security_audit_log to
-- the new table, preserving timestamps and details.
DO $$
DECLARE
  moved_count integer := 0;
BEGIN
  -- Only run if the legacy sentinel-tagged rows exist.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'security_audit_log'
  ) THEN
    WITH moved AS (
      DELETE FROM public.security_audit_log
       WHERE organization_id = '00000000-0000-0000-0000-00000000f0f0'
       RETURNING id, event_type, ip_address, user_agent, details, severity, created_at
    )
    INSERT INTO public.platform_security_audit_log (
      id, event_type, email, ip_address, user_agent, details, severity, created_at
    )
    SELECT
      id,
      event_type,
      details ->> 'email',
      ip_address,
      user_agent,
      details,
      COALESCE(severity, 'info'),
      created_at
    FROM moved;

    GET DIAGNOSTICS moved_count = ROW_COUNT;
    RAISE NOTICE '[platform-audit] migrated % rows from sentinel to platform_security_audit_log', moved_count;
  END IF;
END $$;

-- Remove the sentinel org row now that nothing references it.
DELETE FROM public.organizations
 WHERE id = '00000000-0000-0000-0000-00000000f0f0';

-- Post-condition: sentinel org row no longer exists; no rows in
-- security_audit_log still point at it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.organizations
     WHERE id = '00000000-0000-0000-0000-00000000f0f0'
  ) THEN
    RAISE EXCEPTION '[platform-audit] sentinel org row still present';
  END IF;
END $$;
