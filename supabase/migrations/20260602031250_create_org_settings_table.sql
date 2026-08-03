-- Reconstructed 2026-08-03 from live production schema.
--
-- STATUS: ALREADY APPLIED. This file does not introduce a change — it records
-- one that was already made.
--
-- `public.org_settings` was created directly against production on 2026-06-02
-- (ledger version 20260602031250, name `create_org_settings_table`) with no
-- corresponding file in this repository. The migration-ledger alignment gate
-- reported it as "ledger-only (no FS source)", which is a hard failure: the
-- repository could not reproduce a table production depends on.
--
-- Note that 20260403005_org_settings_hub.sql, despite the name, does NOT create
-- this table — it creates org_branding and org_feature_toggles. So there was
-- genuinely no record of org_settings anywhere in the repo.
--
-- Every statement below was read back from production (information_schema,
-- pg_constraint, pg_indexes, pg_policy) rather than written from memory, and
-- each is guarded so re-running against prod is a no-op.

CREATE TABLE IF NOT EXISTS public.org_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key             text NOT NULL,
  value           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_settings_organization_id_key_key UNIQUE (organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_org_settings_org_key
  ON public.org_settings (organization_id, key);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Correctly correlated: the subquery filters org_members by the caller and the
-- outer predicate compares against the row's own organization_id. Confirmed by
-- the behavioural probe in 20260803003 — org_settings is one of the 141
-- org-scoped tables it sweeps, and it reports no leak and no policy error.
DROP POLICY IF EXISTS org_settings_org_isolation ON public.org_settings;
CREATE POLICY org_settings_org_isolation
  ON public.org_settings
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_members.organization_id
      FROM public.org_members
      WHERE org_members.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT org_members.organization_id
      FROM public.org_members
      WHERE org_members.user_id = (SELECT auth.uid())
    )
  );
