-- Audit 2026-05-27 — PITR restore-test runs ledger.
--
-- Supabase PITR retains 7 days of point-in-time backups. The brief
-- flagged that "recovery is untested" — auditor-unfriendly. We need
-- monthly restore tests with a recorded outcome so SOC2/ISO can quote
-- "documented RPO/RTO + restore test exists".
--
-- Restore itself requires Supabase API/dashboard action; can't be
-- fully automated from a Vercel function. So the workflow is:
--   1. Operator triggers a restore-to-branch (manual or scripted).
--   2. Operator runs scripts/verify-restore.mjs against the restored
--      DB which inspects schema + sample data + key invariants.
--   3. Operator records the test outcome via the
--      record_restore_test_run RPC.
--   4. CI gate scripts/check-restore-test-recency.mjs fails the build
--      if no successful run in the last 35 days.

CREATE TABLE IF NOT EXISTS public.restore_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_at timestamptz NOT NULL DEFAULT now(),
  performed_by text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('passed', 'failed', 'partial')),
  rpo_target_minutes integer NOT NULL DEFAULT 60,
  rto_target_minutes integer NOT NULL DEFAULT 240,
  restored_pitr_target text,
  restored_branch_id text,
  duration_minutes integer,
  invariants_checked text[] NOT NULL DEFAULT ARRAY[]::text[],
  invariants_failed text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text,
  CONSTRAINT restore_test_runs_performed_by_min_length
    CHECK (char_length(trim(performed_by)) >= 3)
);

CREATE INDEX IF NOT EXISTS restore_test_runs_performed_at_idx
  ON public.restore_test_runs (performed_at DESC);

ALTER TABLE public.restore_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restore_test_runs FORCE ROW LEVEL SECURITY;

CREATE POLICY restore_test_runs_deny_all ON public.restore_test_runs
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY restore_test_runs_no_update ON public.restore_test_runs
  AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY restore_test_runs_no_delete ON public.restore_test_runs
  AS RESTRICTIVE FOR DELETE USING (false);

COMMENT ON TABLE public.restore_test_runs IS
  'Audit 2026-05-27: ledger of monthly PITR restore-test runs. Append-only. Service-role only. SOC2 / ISO 27001 evidence for documented RPO/RTO.';

-- RPC for the verifier script to record an outcome.
CREATE OR REPLACE FUNCTION public.record_restore_test_run(
  p_performed_by text,
  p_outcome text,
  p_rpo_target_minutes integer,
  p_rto_target_minutes integer,
  p_restored_pitr_target text,
  p_restored_branch_id text,
  p_duration_minutes integer,
  p_invariants_checked text[],
  p_invariants_failed text[],
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.restore_test_runs (
    performed_by, outcome, rpo_target_minutes, rto_target_minutes,
    restored_pitr_target, restored_branch_id, duration_minutes,
    invariants_checked, invariants_failed, notes
  ) VALUES (
    p_performed_by, p_outcome, p_rpo_target_minutes, p_rto_target_minutes,
    p_restored_pitr_target, p_restored_branch_id, p_duration_minutes,
    p_invariants_checked, p_invariants_failed, p_notes
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_restore_test_run(text, text, integer, integer, text, text, integer, text[], text[], text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_restore_test_run(text, text, integer, integer, text, text, integer, text[], text[], text)
  TO service_role;

-- Surface: most recent test outcome per measure. Used by the CI gate.
CREATE OR REPLACE FUNCTION public.latest_restore_test_run()
RETURNS TABLE (
  performed_at timestamptz,
  outcome text,
  days_since integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT
    r.performed_at,
    r.outcome,
    EXTRACT(EPOCH FROM (now() - r.performed_at))::integer / 86400 AS days_since
  FROM public.restore_test_runs r
  WHERE r.outcome IN ('passed', 'partial')
  ORDER BY r.performed_at DESC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.latest_restore_test_run() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.latest_restore_test_run() TO service_role;
