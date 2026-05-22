-- Status CHECK constraints on the core operational tables.
--
-- Addresses audit P2 finding (§7.6) — "Tables with status columns lacking
-- CHECK constraints (CAPA, incidents, care plans, policies, credentials,
-- tasks)". CAPA and care plans/forms got CHECK constraints in their own
-- migrations (20260618 / 20260208 / 20260402); this migration covers
-- the remaining six tables.
--
-- Strategy:
--   - Each constraint is added with NOT VALID so existing rows are NOT
--     validated. New INSERT/UPDATE writes ARE checked.
--   - Allowlists are unions of the values writers actually emit (per
--     `app/app/actions/*` and `lib/*` grep) plus a small set of common
--     adjacent values that are likely already in production from earlier
--     iterations.
--   - Idempotent: each block guards on whether the table exists and
--     whether the constraint name is already present.
--
-- Operator follow-up (manual, optional):
--   After reviewing existing rows for stragglers, run
--     ALTER TABLE public.<table> VALIDATE CONSTRAINT <constraint_name>;
--   to elevate the constraint from NOT VALID to fully validated. Any
--   existing rows that violate the allowlist will surface at that point.
--
--   To survey current values per table:
--     SELECT status, COUNT(*) FROM public.<table> GROUP BY status ORDER BY 2 DESC;

BEGIN;

-- ---- org_tasks.status ----
-- Writers seen: 'pending' (default), 'completed'. Common adjacent values:
-- 'open', 'in_progress', 'cancelled', 'blocked'. Schema default is 'pending'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_tasks' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_tasks_status_check'
      AND conrelid = 'public.org_tasks'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_tasks
        ADD CONSTRAINT org_tasks_status_check
        CHECK (status IN (
          'pending',
          'open',
          'in_progress',
          'blocked',
          'completed',
          'cancelled',
          'canceled'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

-- ---- org_policies.status ----
-- Writers seen: 'draft' (default), 'review', 'published', 'archived'.
-- Lifecycle introduces 'pending_approval' / 'approved' implicitly via
-- policy_versions, but org_policies row mirrors it via 'review' / 'published'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_policies' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_policies_status_check'
      AND conrelid = 'public.org_policies'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_policies
        ADD CONSTRAINT org_policies_status_check
        CHECK (status IN (
          'draft',
          'review',
          'pending_approval',
          'approved',
          'published',
          'archived'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

-- ---- org_incidents.status ----
-- Writers seen: 'open' (createIncident), 'resolved' (resolveIncident).
-- Adjacent: 'investigating' (CAPA flow says so), 'closed'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_incidents' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_incidents_status_check'
      AND conrelid = 'public.org_incidents'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_incidents
        ADD CONSTRAINT org_incidents_status_check
        CHECK (status IN (
          'open',
          'investigating',
          'resolved',
          'closed',
          'archived'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

-- ---- org_staff_credentials.status ----
-- Writers seen: 'pending' (createStaffCredential), 'verified'
-- (verifyStaffCredential). Adjacent: 'rejected', 'expired'.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_staff_credentials' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_staff_credentials_status_check'
      AND conrelid = 'public.org_staff_credentials'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_staff_credentials
        ADD CONSTRAINT org_staff_credentials_status_check
        CHECK (status IN (
          'pending',
          'verified',
          'rejected',
          'expired',
          'archived'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

-- ---- org_assets.status ----
-- Schema default 'active'. Common asset lifecycle values follow.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_assets' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_assets_status_check'
      AND conrelid = 'public.org_assets'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_assets
        ADD CONSTRAINT org_assets_status_check
        CHECK (status IN (
          'active',
          'inactive',
          'maintenance',
          'retired',
          'archived'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

-- ---- org_risks.status ----
-- Schema default 'open'. Standard risk lifecycle.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_risks' AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_risks_status_check'
      AND conrelid = 'public.org_risks'::regclass
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.org_risks
        ADD CONSTRAINT org_risks_status_check
        CHECK (status IN (
          'open',
          'investigating',
          'mitigating',
          'mitigated',
          'accepted',
          'transferred',
          'closed',
          'archived'
        ))
        NOT VALID
    $C$;
  END IF;
END$$;

COMMIT;
