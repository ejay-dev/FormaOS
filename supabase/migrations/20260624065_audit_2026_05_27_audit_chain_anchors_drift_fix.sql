-- Audit 2026-05-27 — apply-time drift fix for audit_chain_anchors.
--
-- The R3 migration (20260624058) declared the audit_chain_anchors
-- table + policies, but when it was applied via execute_sql the
-- statements were split across two calls and the second call failed
-- mid-way on a pgcrypto hmac signature mismatch. The retry SQL only
-- included the corrected audit_log_append_v3 function definition,
-- so audit_chain_anchors + its indexes + RLS policies never landed.
--
-- Discovered during the operator-handover smoke test: the audit-chain
-- anchor cron would have failed at runtime trying to INSERT into the
-- missing table.
--
-- This migration is idempotent (IF NOT EXISTS + DROP POLICY guards
-- are implicit via the policy CREATE failing benignly if a policy of
-- the same name already exists on a fresh-branch re-apply).

CREATE TABLE IF NOT EXISTS public.audit_chain_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  anchored_at timestamptz NOT NULL DEFAULT now(),
  top_sequence_number bigint NOT NULL,
  top_entry_hash text NOT NULL,
  external_anchor_id text NOT NULL,
  external_provider text NOT NULL,
  external_anchor_url text,
  CONSTRAINT audit_chain_anchors_provider_check
    CHECK (external_provider IN ('sigstore-rekor', 'internal-test'))
);

CREATE INDEX IF NOT EXISTS audit_chain_anchors_org_anchored_at_idx
  ON public.audit_chain_anchors (org_id, anchored_at DESC);
CREATE INDEX IF NOT EXISTS audit_chain_anchors_top_hash_idx
  ON public.audit_chain_anchors (top_entry_hash);

ALTER TABLE public.audit_chain_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain_anchors FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_chain_anchors' AND policyname='audit_chain_anchors_select_org_members') THEN
    CREATE POLICY audit_chain_anchors_select_org_members ON public.audit_chain_anchors
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.org_members m
                      WHERE m.organization_id = audit_chain_anchors.org_id
                        AND m.user_id = (SELECT auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_chain_anchors' AND policyname='audit_chain_anchors_no_update') THEN
    CREATE POLICY audit_chain_anchors_no_update ON public.audit_chain_anchors
      AS RESTRICTIVE FOR UPDATE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_chain_anchors' AND policyname='audit_chain_anchors_no_delete') THEN
    CREATE POLICY audit_chain_anchors_no_delete ON public.audit_chain_anchors
      AS RESTRICTIVE FOR DELETE USING (false);
  END IF;
END $$;

COMMENT ON TABLE public.audit_chain_anchors IS
  'R3 + external anchor (2026-05-27): each row records a hash-chain top-entry submitted to an external transparency log (Sigstore Rekor, internal-test). RESTRICTIVE policies enforce append-only. Org members can SELECT their own anchors; service_role writes.';
