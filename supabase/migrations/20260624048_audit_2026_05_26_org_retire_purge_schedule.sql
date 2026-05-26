-- Audit 2026-05-26 — P0-9: schedule data purge after org retire.
--
-- Background: retireOrganizationLifecycle() locks billing access and
-- sets lifecycle_status='retired', but no data export is triggered and
-- no purge is scheduled. Per ADMIN_OPERATING_POLICY.md §7 the retire
-- flow is supposed to include "export and retention checks" — without
-- them, customer data lingers indefinitely after a retirement and
-- there is no auditable answer to "when does this org's data go away?"
--
-- This migration only adds the *schedule* — two timestamp columns on
-- the organizations row and a tracking column for the kicked-off export
-- job. The actual purge of retired orgs is left to a follow-up:
--   * Manual: ops reviews retired orgs past retire_purge_at and runs
--     a deliberate delete (existing admin tooling).
--   * Automated: a future cron processor that uses these timestamps.
-- A future automated purge MUST land its own design + approval first
-- (cascading deletion across ~80 org_* tables is not a silent change).
--
-- Columns:
--   retire_export_job_id  uuid  — id of the enterprise_export_jobs row
--                                 created when retire ran. Joinable to
--                                 enterprise_export_jobs so ops can see
--                                 the bundle URL once processing finishes.
--   retire_purge_at       timestamptz — moment past which the org is
--                                 eligible for hard deletion. Default
--                                 set by app code from
--                                 ORG_RETIRE_GRACE_DAYS (default 90).

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS retire_export_job_id uuid,
  ADD COLUMN IF NOT EXISTS retire_purge_at      timestamptz;

CREATE INDEX IF NOT EXISTS idx_organizations_retire_purge_at
  ON public.organizations (retire_purge_at)
  WHERE retire_purge_at IS NOT NULL;

COMMENT ON COLUMN public.organizations.retire_export_job_id IS
  'P0-9: enterprise_export_jobs.id of the export kicked off at retire time. NULL if the export failed to enqueue (operators can re-trigger manually).';

COMMENT ON COLUMN public.organizations.retire_purge_at IS
  'P0-9: moment past which this retired org becomes eligible for hard data deletion. Read by future cron purge processor; written by retireOrganizationLifecycle from ORG_RETIRE_GRACE_DAYS (default 90 days).';
