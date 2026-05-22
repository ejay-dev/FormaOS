-- Restore RLS policies that drifted on the security-telemetry tables and the
-- evidence storage bucket, and flip two SECURITY DEFINER views to
-- SECURITY INVOKER. Idempotent: re-running the migration after a clean
-- apply is a no-op.
--
-- Background (audit 2026-05-22):
--   The original migration 20260214_security_monitoring.sql declared
--   RESTRICTIVE service_role policies plus explicit deny policies for
--   anon/authenticated on security_events, security_alerts, active_sessions,
--   and user_activity. The deployed state diverged: the four
--   `*_service_role` policies were PERMISSIVE for role=public with
--   qual='true' and the deny policies were missing. Combined with the
--   OR-of-permissive RLS evaluation rule, this exposed:
--     - security_events (18654 rows)   → audit database-001
--     - security_alerts (4185 rows)    → audit database-002
--     - active_sessions (6237 rows)    → audit database-003
--     - user_activity   (26467 rows)   → audit database-004
--   to anonymous PostgREST callers (SELECT/INSERT/UPDATE/DELETE).
--
--   Storage bucket `evidence` carried two legacy permissive policies
--   ("Allow Evidence View" / "Allow Evidence Upload") that bypassed the
--   per-org `evidence_*` policies; the OR-of-permissive rule meant any
--   authenticated user could read or forge files in any tenant's prefix.
--   → audit isolation-002.
--
--   Two views — `public.risk_summary` and `public.unified_org_audit_log`
--   — were defined SECURITY DEFINER, so they ignored caller RLS and
--   returned cross-tenant rows.
--   → audit database-005, database-006.
--
-- Operator action required after this migration applies:
--   Rotate session tokens issued during the window the permissive
--   active_sessions policy was live. The session_id column was visible
--   to anonymous callers; assume any pre-fix session_id is compromised.

BEGIN;

-- ============================================================================
-- 1. security_events
-- ============================================================================
DROP POLICY IF EXISTS security_events_service_role ON public.security_events;
CREATE POLICY security_events_service_role ON public.security_events
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS security_events_block_users ON public.security_events;
CREATE POLICY security_events_block_users ON public.security_events
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 2. security_alerts
-- ============================================================================
DROP POLICY IF EXISTS security_alerts_service_role ON public.security_alerts;
CREATE POLICY security_alerts_service_role ON public.security_alerts
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS security_alerts_block_users ON public.security_alerts;
CREATE POLICY security_alerts_block_users ON public.security_alerts
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 3. active_sessions  (keep user-read-own-row PERMISSIVE policy)
-- ============================================================================
DROP POLICY IF EXISTS active_sessions_user_read ON public.active_sessions;
CREATE POLICY active_sessions_user_read ON public.active_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS active_sessions_service_role ON public.active_sessions;
CREATE POLICY active_sessions_service_role ON public.active_sessions
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS active_sessions_block_anon ON public.active_sessions;
CREATE POLICY active_sessions_block_anon ON public.active_sessions
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 4. user_activity  (keep user-read-own-row PERMISSIVE policy)
-- ============================================================================
DROP POLICY IF EXISTS user_activity_user_read ON public.user_activity;
CREATE POLICY user_activity_user_read ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_activity_service_role ON public.user_activity;
CREATE POLICY user_activity_service_role ON public.user_activity
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS user_activity_block_anon ON public.user_activity;
CREATE POLICY user_activity_block_anon ON public.user_activity
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 5. storage.objects — drop legacy `evidence` bucket policies that bypass
--    org scoping. The modern evidence_select / evidence_insert /
--    evidence_update / evidence_delete policies (each scoped via
--    split_part(name,'/',1) = org_members.organization_id::text) remain.
-- ============================================================================
DROP POLICY IF EXISTS "Allow Evidence View"   ON storage.objects;
DROP POLICY IF EXISTS "Allow Evidence Upload" ON storage.objects;

-- ============================================================================
-- 6. SECURITY DEFINER views — flip to SECURITY INVOKER so caller RLS applies
-- ============================================================================
ALTER VIEW IF EXISTS public.risk_summary           SET (security_invoker = on);
ALTER VIEW IF EXISTS public.unified_org_audit_log  SET (security_invoker = on);

COMMIT;
