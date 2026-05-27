-- Audit 2026-05-27 (Tier 2.C) — weekly compliance-health snapshots.
--
-- Backs the trend sparkline on /app/compliance/health. Each weekly run
-- of /api/cron/compliance-health-snapshot computes the aggregate via
-- lib/compliance/health/aggregate.ts and writes a single row per org.
--
-- Snapshots are append-only. The CI gate doesn't enforce retention yet
-- — the next audit cycle can add a TTL prune if the table grows past
-- ~52 rows per org per year.

CREATE TABLE IF NOT EXISTS public.org_compliance_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  overall_score numeric(5, 4) NOT NULL,
  framework_count integer NOT NULL,
  total_controls integer NOT NULL,
  status_counts jsonb NOT NULL,
  frameworks jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_compliance_health_snapshots_org_at_idx
  ON public.org_compliance_health_snapshots (organization_id, snapshot_at DESC);

ALTER TABLE public.org_compliance_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_compliance_health_snapshots FORCE ROW LEVEL SECURITY;

-- Org members may SELECT their own snapshots; INSERT/UPDATE/DELETE are
-- service-role-only (cron path), so the table is effectively append-only
-- from the application's point of view.
CREATE POLICY org_compliance_health_snapshots_select_org_members
  ON public.org_compliance_health_snapshots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_compliance_health_snapshots.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY org_compliance_health_snapshots_no_write
  ON public.org_compliance_health_snapshots
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY org_compliance_health_snapshots_no_update
  ON public.org_compliance_health_snapshots
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY org_compliance_health_snapshots_no_delete
  ON public.org_compliance_health_snapshots
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

COMMENT ON TABLE public.org_compliance_health_snapshots IS
  'Audit 2026-05-27 (Tier 2.C): weekly snapshot of cross-framework health for the trend sparkline on /app/compliance/health. Service-role-only writes via /api/cron/compliance-health-snapshot.';
