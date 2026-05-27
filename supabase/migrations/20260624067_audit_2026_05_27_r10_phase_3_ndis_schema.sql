-- Audit 2026-05-27 (R10 Phase 3) — NDIS schema additions to back the
-- statutory + published-guidance predicates.
--
-- Phase 3 closes the gap from Phase 2's 11/25 real-predicate coverage
-- to 22/25 by adding two small schema artefacts that 8 indicators
-- need, then refining the rest against existing tables (org_policies,
-- org_form_submissions, org_registers — reused via taxonomy columns).
--
-- Predicates land in lib/compliance/evaluators/ndis/_predicates.ts.
-- The statutory citation map is in docs/compliance/ndis-framework-status.md.
--
-- Two additions in this migration:
--   1. org_policies.ndis_category — text column tagging policies by
--      Practice Standard so predicates can pick the right policy
--      (privacy vs governance vs safeguarding vs information mgmt).
--      Defaults to NULL; CHECK constraint restricts values to a known
--      taxonomy. Customers tag via admin UI; predicates skip rows
--      with NULL category (legacy / untagged policies don't satisfy
--      the predicate but don't break it).
--   2. org_behaviour_support_plans — distinct enough from generic
--      registers to deserve its own table. Tracks interim vs
--      comprehensive plans, authorisation status, expiry. Drives
--      NDIS-V.2 + NDIS-M.2 predicates.
--
-- Everything else (conflicts of interest, business continuity plans,
-- intake records, transitions, environment assessments, financial
-- delegations, supervision records) reuses public.org_registers with
-- a distinct `type` value — no new tables for them.

-- =========================================================================
-- 1. org_policies.ndis_category
-- =========================================================================

ALTER TABLE public.org_policies
  ADD COLUMN IF NOT EXISTS ndis_category text;

ALTER TABLE public.org_policies
  DROP CONSTRAINT IF EXISTS org_policies_ndis_category_check;

ALTER TABLE public.org_policies
  ADD CONSTRAINT org_policies_ndis_category_check
    CHECK (
      ndis_category IS NULL
      OR ndis_category IN (
        'privacy',              -- NDIS-1.3
        'safeguarding',         -- NDIS-1.5
        'governance',           -- NDIS-2.1
        'risk_management',      -- NDIS-2.2
        'quality_management',   -- NDIS-2.3
        'information_management', -- NDIS-2.4
        'complaints',           -- NDIS-2.5
        'incident_management',  -- NDIS-2.6
        'hr_management',        -- NDIS-2.7
        'continuity',           -- NDIS-2.8
        'access',               -- NDIS-3.1
        'service_agreements',   -- NDIS-3.3
        'transitions',          -- NDIS-3.5
        'safe_environment',     -- NDIS-4.1
        'financial_management', -- NDIS-4.2
        'medication',           -- NDIS-M.1
        'restrictive_practices', -- NDIS-V.2 / M.2
        'worker_engagement'     -- NDIS-W.1
      )
    );

CREATE INDEX IF NOT EXISTS org_policies_ndis_category_idx
  ON public.org_policies (organization_id, ndis_category)
  WHERE ndis_category IS NOT NULL;

COMMENT ON COLUMN public.org_policies.ndis_category IS
  'R10 Phase 3 (2026-05-27): NDIS Practice Standard category. Predicates in lib/compliance/evaluators/ndis/_predicates.ts look up policies by category. Customer tags via admin UI; NULL = untagged (predicate treats as absent).';

-- =========================================================================
-- 2. org_behaviour_support_plans
-- =========================================================================
--
-- NDIS Restrictive Practices and Behaviour Support Rules 2018 (F2018L00632)
-- defines the lifecycle:
--   * interim BSP within 1 month of first regulated restrictive practice use
--   * comprehensive BSP within 6 months
--   * BSP reviewed annually (and on participant change)
--   * authorisation required from state/territory body
--
-- This table tracks per-participant BSPs with the lifecycle fields
-- predicates need (plan_type, authorised_at, expires_at, etc.).

CREATE TABLE IF NOT EXISTS public.org_behaviour_support_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  participant_id uuid, -- FK to org_patients (loosely typed; not all orgs use that table)
  plan_type text NOT NULL CHECK (plan_type IN ('interim', 'comprehensive')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','authorised','active','expired','withdrawn')),
  -- Timeline fields drive the V.2 + M.2 predicates
  first_restrictive_practice_at timestamptz,
  drafted_at timestamptz NOT NULL DEFAULT now(),
  authorised_at timestamptz,
  effective_from timestamptz,
  expires_at timestamptz,
  reviewed_at timestamptz,
  -- Authorisation source — state/territory authorising body name
  authorising_body text,
  authorisation_reference text,
  -- Specialist behaviour support provider (NDIS registration required)
  sbs_provider_name text,
  sbs_provider_registration_id text,
  -- Free-form fields for plan content (the actual BSP is usually a PDF;
  -- this row tracks its existence + lifecycle)
  evidence_file_id uuid, -- link to org_evidence if uploaded
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_behaviour_support_plans_org_status_idx
  ON public.org_behaviour_support_plans (organization_id, status);
CREATE INDEX IF NOT EXISTS org_behaviour_support_plans_participant_idx
  ON public.org_behaviour_support_plans (organization_id, participant_id);
CREATE INDEX IF NOT EXISTS org_behaviour_support_plans_expires_at_idx
  ON public.org_behaviour_support_plans (organization_id, expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.org_behaviour_support_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_behaviour_support_plans FORCE ROW LEVEL SECURITY;

-- Org members SELECT + INSERT; owner/admin can UPDATE + DELETE
CREATE POLICY org_behaviour_support_plans_select_org_members
  ON public.org_behaviour_support_plans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_behaviour_support_plans.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY org_behaviour_support_plans_insert_org_members
  ON public.org_behaviour_support_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_behaviour_support_plans.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY org_behaviour_support_plans_update_privileged
  ON public.org_behaviour_support_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_behaviour_support_plans.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'compliance_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_behaviour_support_plans.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin', 'compliance_admin')
    )
  );

CREATE POLICY org_behaviour_support_plans_delete_privileged
  ON public.org_behaviour_support_plans
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_behaviour_support_plans.organization_id
        AND m.user_id = (SELECT auth.uid())
        AND m.role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE public.org_behaviour_support_plans IS
  'R10 Phase 3 (2026-05-27): per-participant behaviour support plans. Tracks the BSP lifecycle (interim vs comprehensive, authorisation, expiry) required by the NDIS Restrictive Practices and Behaviour Support Rules 2018 (F2018L00632). Predicates in lib/compliance/evaluators/ndis/_predicates.ts use this table for NDIS-V.2 and NDIS-M.2.';

-- =========================================================================
-- 3. org_registers — taxonomy notes (no schema change; CHECK relaxed)
-- =========================================================================
-- The org_registers `type` column is free-form text so customers can
-- adopt the NDIS Phase 3 taxonomy at their pace. Predicate-side accepts:
--   * 'conflict_of_interest' — NDIS-2.1
--   * 'business_continuity_plan' — NDIS-2.8
--   * 'intake' — NDIS-3.1
--   * 'service_agreement' — NDIS-3.3 (alternative to org_form_submissions)
--   * 'transition' — NDIS-3.5
--   * 'environment_assessment' — NDIS-4.1
--   * 'financial_delegation' — NDIS-4.2
--   * 'supervision' — NDIS-W.1
--   * 'restrictive_practice_use' — NDIS-V.2 monthly reporting log
--   * 'complaint' — NDIS-2.5 (existing; unchanged)
-- No schema change here — just documented for future maintainers.
COMMENT ON COLUMN public.org_registers.type IS
  'R10 Phase 3 (2026-05-27): NDIS-aware free-form register taxonomy. Predicate-side values include conflict_of_interest, business_continuity_plan, intake, service_agreement, transition, environment_assessment, financial_delegation, supervision, restrictive_practice_use, complaint. See lib/compliance/evaluators/ndis/_predicates.ts.';
