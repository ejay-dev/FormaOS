-- Audit 2026-05-27 — dormant-user review surface.
--
-- The GDPR decision matrix (docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md)
-- already covers explicit purge requests via user_purge_jobs + the
-- hourly cron. What it does NOT cover: users who left an org (or
-- never joined one) and have been inactive for a long time, where
-- AU Privacy Act's "reasonably practicable" + the platform's stated
-- retention promise (none, currently) leaves room for review.
--
-- This migration ships a NON-DESTRUCTIVE review surface:
--   1. A view that lists candidate dormant users.
--   2. A table that captures the monthly snapshot for audit.
--   3. A cron at /api/cron/dormant-users-report fills the table.
--
-- Operators review the snapshot monthly; for each candidate they
-- decide whether to:
--   (a) leave the user (rare — they may legitimately return)
--   (b) trigger a normal P0-8 GDPR purge via the existing endpoint
--       /api/admin/users/<userId>/gdpr-purge
--
-- No auto-deletion. The platform never decides irreversibly without
-- a human in the loop.

-- View: candidate dormant users. Definition:
--   * confirmed user (auth.users.confirmed_at IS NOT NULL)
--   * NOT currently in any org_members row
--   * last_sign_in_at older than the dormancy window (default 730 days
--     = 2 years; operators tune via the cron's DORMANT_USER_DAYS env)
--   * NOT already part of an in-flight or completed user_purge_jobs row
CREATE OR REPLACE VIEW public.dormant_user_candidates AS
SELECT
  u.id AS user_id,
  u.email,
  u.last_sign_in_at,
  u.created_at AS user_created_at,
  EXTRACT(EPOCH FROM (now() - COALESCE(u.last_sign_in_at, u.created_at))) / 86400 AS days_since_active
FROM auth.users u
WHERE u.confirmed_at IS NOT NULL
  AND u.deleted_at IS NULL
  AND u.banned_until IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.org_members m WHERE m.user_id = u.id)
  AND COALESCE(u.last_sign_in_at, u.created_at) < now() - interval '730 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_purge_jobs upj WHERE upj.user_id = u.id
  );

COMMENT ON VIEW public.dormant_user_candidates IS
  'Audit 2026-05-27: confirmed users with no active org membership and >730 days of inactivity, excluded if already in user_purge_jobs. Reviewed monthly by the /api/cron/dormant-users-report cron.';

-- Table: monthly snapshot for audit trail. Service-role-only.
CREATE TABLE IF NOT EXISTS public.dormant_user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshotted_at timestamptz NOT NULL DEFAULT now(),
  candidate_count integer NOT NULL,
  threshold_days integer NOT NULL,
  candidate_user_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  notes text
);

CREATE INDEX IF NOT EXISTS dormant_user_reviews_snapshotted_at_idx
  ON public.dormant_user_reviews (snapshotted_at DESC);

ALTER TABLE public.dormant_user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormant_user_reviews FORCE ROW LEVEL SECURITY;

CREATE POLICY dormant_user_reviews_deny_all ON public.dormant_user_reviews
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
CREATE POLICY dormant_user_reviews_no_update ON public.dormant_user_reviews
  AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY dormant_user_reviews_no_delete ON public.dormant_user_reviews
  AS RESTRICTIVE FOR DELETE USING (false);

COMMENT ON TABLE public.dormant_user_reviews IS
  'Audit 2026-05-27: monthly snapshot of dormant_user_candidates. RESTRICTIVE policies enforce append-only. Service-role-only.';

-- Helper RPC for the cron to record a snapshot without needing
-- direct INSERT permissions on the table.
CREATE OR REPLACE FUNCTION public.snapshot_dormant_users(p_threshold_days integer DEFAULT 730)
RETURNS TABLE (
  review_id uuid,
  candidate_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ids uuid[];
  v_count integer;
  v_review_id uuid;
BEGIN
  -- Re-derive the candidate set with the requested threshold so the
  -- cron can pass a different DORMANT_USER_DAYS without DDL.
  SELECT array_agg(user_id), count(*)
    INTO v_ids, v_count
    FROM (
      SELECT u.id AS user_id
      FROM auth.users u
      WHERE u.confirmed_at IS NOT NULL
        AND u.deleted_at IS NULL
        AND u.banned_until IS NULL
        AND NOT EXISTS (SELECT 1 FROM public.org_members m WHERE m.user_id = u.id)
        AND COALESCE(u.last_sign_in_at, u.created_at) < now() - (p_threshold_days || ' days')::interval
        AND NOT EXISTS (SELECT 1 FROM public.user_purge_jobs upj WHERE upj.user_id = u.id)
    ) candidates;

  INSERT INTO public.dormant_user_reviews (
    candidate_count, threshold_days, candidate_user_ids
  ) VALUES (
    COALESCE(v_count, 0), p_threshold_days, COALESCE(v_ids, ARRAY[]::uuid[])
  ) RETURNING id INTO v_review_id;

  RETURN QUERY SELECT v_review_id, COALESCE(v_count, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.snapshot_dormant_users(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_dormant_users(integer) TO service_role;
