-- Sprint 6c — close the manual-attestation loop.
--
-- ~157 control evaluators across the SOC2/ISO27001/HIPAA/PCI-DSS/CIS/
-- NIST-CSF/GDPR packs emit `status='not_evaluated'` with a gap of
-- `code='manual_attestation_required'`. The 2026-05-23 audit caught
-- that there was no UI for completing those attestations — the
-- framework packs were structurally complete but practically PowerPoint.
--
-- This migration adds the persistence layer. Workflow has two states:
--
--   1. claimed   — someone has marked a control as satisfied and
--                  attached evidence
--   2. reviewed  — a DIFFERENT user has reviewed and approved it
--
-- Plus a `rejected` terminal state that resets and forces a new claim.
--
-- CHECK constraint on (status='reviewed' AND reviewed_by != claimed_by)
-- enforces the separation-of-duties requirement common in SOC 2 / ISO
-- 27001 — the same person can't both claim and approve.
--
-- evidence_id is NOT NULL: every attestation MUST link an evidence row,
-- so the act of attesting always leaves an artefact. UI surface is
-- /app/compliance/attestations.

CREATE TABLE IF NOT EXISTS public.org_control_attestations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework_id    uuid NOT NULL REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  control_key     text NOT NULL,
  status          text NOT NULL DEFAULT 'claimed',
  claimed_by      uuid NOT NULL REFERENCES auth.users(id),
  claimed_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  rejected_reason text,
  evidence_id     uuid NOT NULL REFERENCES public.org_evidence(id) ON DELETE RESTRICT,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT org_control_attestations_status_check
    CHECK (status IN ('claimed', 'reviewed', 'rejected')),

  -- Separation of duties: the reviewer must be a different user from the
  -- claimer once status is 'reviewed'. Lets a single-admin org claim and
  -- review concurrently in their own session (status stays 'claimed')
  -- but blocks self-approval.
  CONSTRAINT org_control_attestations_segregation_check
    CHECK (
      status != 'reviewed'
      OR (reviewed_by IS NOT NULL AND reviewed_by != claimed_by)
    ),

  -- A rejected attestation must carry a reason so the next claimer
  -- knows what to fix.
  CONSTRAINT org_control_attestations_rejected_reason_check
    CHECK (
      status != 'rejected'
      OR (rejected_reason IS NOT NULL AND length(rejected_reason) > 0)
    )
);

-- Latest attestation per (org, framework, control) wins. Compound index
-- supports the list-resolver query that joins against
-- org_control_evaluations.
CREATE INDEX IF NOT EXISTS org_control_attestations_org_fw_ctrl_idx
  ON public.org_control_attestations (organization_id, framework_id, control_key, claimed_at DESC);

CREATE INDEX IF NOT EXISTS org_control_attestations_pending_idx
  ON public.org_control_attestations (organization_id, status)
  WHERE status = 'claimed';

-- updated_at trigger
CREATE OR REPLACE FUNCTION public._touch_org_control_attestations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS org_control_attestations_set_updated_at
  ON public.org_control_attestations;
CREATE TRIGGER org_control_attestations_set_updated_at
  BEFORE UPDATE ON public.org_control_attestations
  FOR EACH ROW EXECUTE FUNCTION public._touch_org_control_attestations_updated_at();

-- RLS: per-org isolation. Service-role bypasses (used by writeAuditLog
-- chain writer + cron); authenticated users only see/mutate their org's
-- rows.
ALTER TABLE public.org_control_attestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_control_attestations_org_select
  ON public.org_control_attestations;
CREATE POLICY org_control_attestations_org_select
  ON public.org_control_attestations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_control_attestations.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS org_control_attestations_org_insert
  ON public.org_control_attestations;
CREATE POLICY org_control_attestations_org_insert
  ON public.org_control_attestations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_control_attestations.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS org_control_attestations_org_update
  ON public.org_control_attestations;
CREATE POLICY org_control_attestations_org_update
  ON public.org_control_attestations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_control_attestations.organization_id
        AND m.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.org_control_attestations IS
  'Audit Sprint 6c (2026-05-23): per-control manual attestations with a '
  'two-state workflow (claimed → reviewed). Backs '
  'app/app/compliance/attestations/page.tsx. Server actions in '
  'app/app/actions/compliance-attestations.ts. Hash-chained via '
  'lib/audit/audit-engine.writeAuditLog.';
