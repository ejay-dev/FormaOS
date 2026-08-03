-- Audit 2026-08-02 — add the organization lifecycle columns the admin console
-- has been writing to a table that does not have them.
--
-- lib/admin/org-lifecycle.ts (suspendOrganization / retireOrganization /
-- restoreOrganization) writes lifecycle_status, lifecycle_reason, suspended_at,
-- suspended_by, retired_at and retired_by. None of the six exist in production:
--
--   select column_name from information_schema.columns
--    where table_name='organizations'
--      and (column_name like '%lifecycle%' or column_name like '%suspend%'
--           or column_name like '%retire%');
--   -> is_active, retire_export_job_id, retire_purge_at
--
-- Because supabase-js returns errors rather than throwing, those UPDATEs failed
-- with 42703 and the result was discarded, so suspend and retire reported
-- success to the operator while changing nothing on the organisation row. This
-- migration is the missing half of that feature — patching the code alone would
-- only have changed which way it was broken.
--
-- Additive and nullable throughout: no existing row changes meaning, and
-- lifecycle_status backfills to 'active' which is what every current row is.

BEGIN;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lifecycle_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid,
  ADD COLUMN IF NOT EXISTS retired_at timestamptz,
  ADD COLUMN IF NOT EXISTS retired_by uuid;

-- Constraint added separately and NOT VALIDated first so the statement cannot
-- block on a full table scan of a live table; validated immediately after,
-- which takes only a SHARE UPDATE EXCLUSIVE lock.
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_lifecycle_status_check;
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_lifecycle_status_check
  CHECK (lifecycle_status IN ('active', 'suspended', 'retired')) NOT VALID;
ALTER TABLE public.organizations
  VALIDATE CONSTRAINT organizations_lifecycle_status_check;

-- suspended_by / retired_by deliberately carry NO foreign key to auth.users.
-- The audit found ~25 existing FKs to auth.users without ON DELETE, which abort
-- a GDPR right-to-erasure delete; adding two more would widen that problem. The
-- authoritative actor record is the admin_audit_log row written alongside each
-- lifecycle transition, which is retained independently of the user.

-- Partial index: lifecycle queries only ever look for the non-active rows, and
-- in production essentially every row is 'active', so a full index would be
-- almost entirely dead weight.
CREATE INDEX IF NOT EXISTS organizations_lifecycle_status_idx
  ON public.organizations (lifecycle_status)
  WHERE lifecycle_status <> 'active';

COMMIT;
