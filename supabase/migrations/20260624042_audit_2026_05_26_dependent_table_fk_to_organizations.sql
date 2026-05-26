-- Audit 2026-05-26 — dependent-table FKs from orgs → organizations.
--
-- Discovery during re-audit (2026-05-26): three tables have FK
-- constraints on `org_id` that target the legacy `orgs(id)` table —
--
--   org_files.org_id          → orgs(id)  ON DELETE CASCADE
--   org_industries.org_id     → orgs(id)  ON DELETE CASCADE
--   org_module_entitlements.org_id → orgs(id)  ON DELETE CASCADE
--
-- These FK constraints predate the committed migrations (added via
-- dashboard / earlier baselines that didn't carry the FK clause
-- inline). The `orgs` table is itself a legacy mirror of
-- `organizations`, kept in sync today by mirror-legacy-orgs.ts and the
-- trigger added in 20260624025. Every value in those FK columns is also
-- a valid row in `organizations(id)`.
--
-- This migration repoints the three FKs from `orgs(id)` to
-- `organizations(id)`. After this lands, the legacy `orgs` table is
-- no longer load-bearing for these tables — it remains only for the
-- `memberships.org_id` legacy column (and the trigger sync). Phase B
-- (a separate PR) can drop the `memberships.org_id` column and sunset
-- `orgs` entirely.
--
-- Safety:
--   - All three tables are empty in production (verified 2026-05-26 via
--     read-only MCP query: 0 rows each). Repointing an FK on an empty
--     table is a metadata-only DDL change.
--   - `memberships.organization_id` already has a FK to
--     `organizations(id)` (constraint `memberships_organization_id_fkey`),
--     so this migration does NOT touch memberships.
--   - `org_audit_log` does NOT exist in this environment — the audit
--     surface uses different tables (audit_log, org_audit_events,
--     org_audit_logs). The previous migration draft referenced
--     `org_audit_log`; that section is dropped here.
--
-- Each repoint runs as DROP + ADD inside a single transaction so that a
-- partial state cannot leak.

BEGIN;

-- ---------------------------------------------------------------------------
-- org_files
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_files_org_id_fkey'
      AND conrelid = 'public.org_files'::regclass
      AND confrelid = 'public.orgs'::regclass
  ) THEN
    ALTER TABLE public.org_files
      DROP CONSTRAINT org_files_org_id_fkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_files_org_id_fkey'
      AND conrelid = 'public.org_files'::regclass
      AND confrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.org_files
      ADD CONSTRAINT org_files_org_id_fkey
      FOREIGN KEY (org_id)
      REFERENCES public.organizations(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- org_industries
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_industries_org_id_fkey'
      AND conrelid = 'public.org_industries'::regclass
      AND confrelid = 'public.orgs'::regclass
  ) THEN
    ALTER TABLE public.org_industries
      DROP CONSTRAINT org_industries_org_id_fkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_industries_org_id_fkey'
      AND conrelid = 'public.org_industries'::regclass
      AND confrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.org_industries
      ADD CONSTRAINT org_industries_org_id_fkey
      FOREIGN KEY (org_id)
      REFERENCES public.organizations(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- org_module_entitlements
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_module_entitlements_org_id_fkey'
      AND conrelid = 'public.org_module_entitlements'::regclass
      AND confrelid = 'public.orgs'::regclass
  ) THEN
    ALTER TABLE public.org_module_entitlements
      DROP CONSTRAINT org_module_entitlements_org_id_fkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_module_entitlements_org_id_fkey'
      AND conrelid = 'public.org_module_entitlements'::regclass
      AND confrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.org_module_entitlements
      ADD CONSTRAINT org_module_entitlements_org_id_fkey
      FOREIGN KEY (org_id)
      REFERENCES public.organizations(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Postcondition — all three FKs now target organizations.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM (VALUES
    ('org_files_org_id_fkey', 'public.org_files'::regclass),
    ('org_industries_org_id_fkey', 'public.org_industries'::regclass),
    ('org_module_entitlements_org_id_fkey', 'public.org_module_entitlements'::regclass)
  ) AS expected(conname, conrelid)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE pg_constraint.conname = expected.conname
      AND pg_constraint.conrelid = expected.conrelid
      AND pg_constraint.confrelid = 'public.organizations'::regclass
  );

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      'Audit 2026-05-26 FK migration: % expected FK(s) not pointing at organizations',
      bad_count;
  END IF;
END$$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Phase B preview (separate PR, NOT executed here):
--
--   -- Drop the now-redundant legacy `org_id` column on memberships once
--   -- all app code has been refactored to read/write `organization_id`:
--   ALTER TABLE public.memberships DROP COLUMN org_id;
--
--   -- Sunset the `orgs` table once `memberships.org_id` is gone. Drop
--   -- the mirror-legacy-orgs.ts helper and the triggers added in
--   -- migrations 20260624025, 20260624026, 20260624029.
--   ALTER TABLE public.memberships
--     DROP CONSTRAINT IF EXISTS memberships_org_fk;
--   DROP TRIGGER ... ON public.organizations;  -- 3 triggers
--   DROP TABLE public.orgs;
--   DROP TABLE public.__pre_orgs_sync_2026_05_25_orgs_only;
--
-- Phase B is a coordinated PR with feature-flag rollout. The risk is in
-- the app-code refactor of the remaining `from('orgs')` call sites,
-- not in the DDL.
-- ---------------------------------------------------------------------------
