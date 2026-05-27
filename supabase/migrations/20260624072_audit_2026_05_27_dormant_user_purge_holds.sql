-- Audit 2026-05-27 (Tier 4.4) — dormant-user retention holds.
--
-- Decision: hybrid retention policy
--   * 24 months dormant → user appears in dormant_user_candidates view
--     (already shipped via migration 20260624063). Operator reviews
--     monthly via /api/cron/dormant-users-report.
--   * 36 months dormant → user is auto-purged via the new
--     /api/cron/process-dormant-user-purges cron UNLESS an operator
--     has placed a retention hold on the user (escape hatch).
--
-- This table is the escape hatch. Operators add a row to halt the
-- hard-delete clock for a specific user — useful for known-long-cycle
-- customers (annual auditors, slow-roll enterprise tenants) or any
-- situation where a regulator-mandated retention window outlasts the
-- 36-month default.

CREATE TABLE IF NOT EXISTS public.dormant_user_purge_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  placed_by uuid,
  reason text NOT NULL,
  -- When NULL, hold is indefinite. When set, the cron resumes counting
  -- after this timestamp passes (operator can plan a finite extension).
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dormant_user_purge_holds_user_idx
  ON public.dormant_user_purge_holds (user_id);

ALTER TABLE public.dormant_user_purge_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormant_user_purge_holds FORCE ROW LEVEL SECURITY;

-- App-side roles cannot read/write directly — service_role only via cron
-- + admin UI server actions. Matches the dormant_user_reviews shape.
CREATE POLICY dormant_user_purge_holds_deny_all
  ON public.dormant_user_purge_holds
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

COMMENT ON TABLE public.dormant_user_purge_holds IS
  'Audit 2026-05-27 (Tier 4.4): operator-placed retention holds blocking the 36-month dormant-user purge. Active hold = no row deleted_at AND (expires_at IS NULL OR expires_at > now()). Service-role + admin-UI only.';
