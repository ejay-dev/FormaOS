-- Audit 2026-05-25 follow-up: enable RLS on the archive table created in
-- 20260624027 so the static + live RLS scanners stay green. The table
-- contains sensitive (legacy-fixture) data and is intentionally
-- service-role-only — enabling RLS with no policies is the correct
-- posture: every connecting role except service_role gets implicit deny.

ALTER TABLE IF EXISTS public.__pre_orgs_sync_2026_05_25_orgs_only
  ENABLE ROW LEVEL SECURITY;
