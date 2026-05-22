-- audit v2 regression fixes (2026-05-22).
-- The 7 audit-v1 migrations applied earlier today fixed primary findings but
-- introduced secondary writes that silently fail because the target tables/
-- columns don't exist. v2's verification + uncovered-surface agents caught:
--
--   * v2-rls-001 (P0): control_evidence + control_tasks have RLS=true with
--     ZERO policies. PR #115 backfilled 74 control_evidence rows that are
--     invisible to authenticated sessions; uploadEvidence's session-client
--     upsert is silently denied; the org_controls view's latest_evidence_id
--     subquery returns NULL for session callers.
--
--   * v2-uncov-001 / v2-regress-002 (P1): PR #112 charge.refunded handler
--     inserts into billing_events_audit — a table that does not exist.
--
--   * v2-uncov-002 (P1): PR #112 charge.dispute.* handlers UPDATE columns
--     dispute_open / dispute_opened_at / dispute_closed_at on org_subscriptions
--     that do not exist. The defensive regex check inside the handler swallows
--     the error so disputes never flag the org.
--
-- The corresponding code-side regressions (billing_reconciliation_log column
-- mismatch, compliance_frameworks.slug join error, dashboard widget status
-- normalisation, drift-bypass on customer-fallback path) are fixed in the
-- code diff in the same PR.

BEGIN;

-- ============================================================================
-- 1. control_evidence / control_tasks — org-scoped RLS policies
-- ============================================================================
DROP POLICY IF EXISTS control_evidence_org_member_select ON public.control_evidence;
CREATE POLICY control_evidence_org_member_select
  ON public.control_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_evidence.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS control_evidence_org_writer_insert ON public.control_evidence;
CREATE POLICY control_evidence_org_writer_insert
  ON public.control_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_evidence.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer','staff','member')
    )
  );

DROP POLICY IF EXISTS control_evidence_org_writer_update ON public.control_evidence;
CREATE POLICY control_evidence_org_writer_update
  ON public.control_evidence
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_evidence.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

DROP POLICY IF EXISTS control_evidence_org_writer_delete ON public.control_evidence;
CREATE POLICY control_evidence_org_writer_delete
  ON public.control_evidence
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_evidence.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

-- control_tasks: same pattern — tenant SELECT for all members, INSERT/UPDATE/
-- DELETE for compliance writers. control_tasks is the join between org_tasks
-- and compliance_controls; the writes happen via the framework provisioning
-- flow under owner/admin.
DROP POLICY IF EXISTS control_tasks_org_member_select ON public.control_tasks;
CREATE POLICY control_tasks_org_member_select
  ON public.control_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_tasks.organization_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS control_tasks_org_writer_insert ON public.control_tasks;
CREATE POLICY control_tasks_org_writer_insert
  ON public.control_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_tasks.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

DROP POLICY IF EXISTS control_tasks_org_writer_update ON public.control_tasks;
CREATE POLICY control_tasks_org_writer_update
  ON public.control_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_tasks.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

DROP POLICY IF EXISTS control_tasks_org_writer_delete ON public.control_tasks;
CREATE POLICY control_tasks_org_writer_delete
  ON public.control_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = control_tasks.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

-- ============================================================================
-- 2. billing_events_audit — table that PR #112's charge.refunded handler
--    expects but never existed.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.billing_events_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_type text NOT NULL,
  stripe_customer_id text,
  stripe_charge_id text,
  amount integer,
  currency text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_billing_events_audit_org
  ON public.billing_events_audit (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_audit_stripe_customer
  ON public.billing_events_audit (stripe_customer_id);

ALTER TABLE public.billing_events_audit ENABLE ROW LEVEL SECURITY;

-- Read-only for org members; writes only via service_role (webhook handler
-- uses admin client).
DROP POLICY IF EXISTS billing_events_audit_org_member_select ON public.billing_events_audit;
CREATE POLICY billing_events_audit_org_member_select
  ON public.billing_events_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = billing_events_audit.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','manager','compliance_officer')
    )
  );

DROP POLICY IF EXISTS billing_events_audit_block_writes ON public.billing_events_audit;
CREATE POLICY billing_events_audit_block_writes
  ON public.billing_events_audit
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- ============================================================================
-- 3. org_subscriptions.dispute_* columns — referenced by PR #112's
--    charge.dispute.created / closed handlers but never added.
-- ============================================================================
ALTER TABLE public.org_subscriptions
  ADD COLUMN IF NOT EXISTS dispute_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispute_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_closed_at timestamptz;

COMMIT;
