-- Audit 2026-05-26 — P0-6 / P0-7: enforce referential integrity on two tables
-- that were nominally org-scoped but had no FK to organizations.
--
-- Background:
--   * public.tasks has `organization_id uuid` declared NULLABLE with NO FK.
--     Rows therefore persist after the parent org is deleted, and a row
--     can be created with a NULL or fabricated org id. Nothing in the
--     schema notices.
--   * public.org_compliance_status has `organization_id uuid PRIMARY KEY`
--     but no FK to organizations. Same orphan-after-delete problem.
--
-- Fix: add ON DELETE CASCADE FKs and tighten NOT NULL on tasks.
--
-- Safety: this migration ABORTS if it would silently corrupt data —
--   * tasks rows with NULL organization_id  → operator must backfill first.
--   * tasks rows whose organization_id has no matching organizations row →
--     operator must delete or repoint them first.
--   * org_compliance_status rows pointing at no-such-org → ditto.
-- Recovery query when this migration aborts on orphans:
--
--   -- preview rows that block the migration
--   SELECT id, organization_id, created_at FROM public.tasks
--     WHERE organization_id IS NULL OR organization_id NOT IN (
--       SELECT id FROM public.organizations
--     );
--   SELECT organization_id, last_evaluated_at FROM public.org_compliance_status
--     WHERE organization_id NOT IN (SELECT id FROM public.organizations);
--
-- Once the offending rows are dealt with (delete, or repoint the
-- organization_id), this migration re-runs cleanly.

DO $$
DECLARE
  null_tasks bigint;
  orphan_tasks bigint;
  orphan_status bigint;
BEGIN
  -- ---------------------------------------------------------------------
  -- tasks
  -- ---------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'tasks'
       AND column_name = 'organization_id'
  ) THEN
    SELECT count(*) INTO null_tasks
      FROM public.tasks
     WHERE organization_id IS NULL;

    SELECT count(*) INTO orphan_tasks
      FROM public.tasks t
     WHERE t.organization_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.organizations o WHERE o.id = t.organization_id
       );

    IF null_tasks > 0 THEN
      RAISE EXCEPTION
        'P0-6: cannot enforce NOT NULL on public.tasks.organization_id — % row(s) have NULL. Backfill or delete them first; see comment block at top of this migration for the preview query.',
        null_tasks;
    END IF;

    IF orphan_tasks > 0 THEN
      RAISE EXCEPTION
        'P0-6: cannot add FK on public.tasks.organization_id — % row(s) reference a non-existent organization. Clean them up first.',
        orphan_tasks;
    END IF;

    -- Tighten NOT NULL only after the backfill check passes.
    ALTER TABLE public.tasks
      ALTER COLUMN organization_id SET NOT NULL;

    -- Add the FK if not present. Use a distinct name so re-runs don't
    -- collide with whatever Supabase may have auto-named earlier.
    IF NOT EXISTS (
      SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_class p ON p.oid = c.confrelid
       WHERE c.contype = 'f'
         AND t.relname = 'tasks'
         AND p.relname = 'organizations'
    ) THEN
      ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_organization_id_fkey
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE;
    END IF;

    -- A FK column that points at a frequently deleted parent benefits
    -- from a supporting index; without one, parent-row deletion does a
    -- sequential scan of the child to enforce CASCADE.
    CREATE INDEX IF NOT EXISTS idx_tasks_organization_id
      ON public.tasks (organization_id);

    RAISE NOTICE 'tasks.organization_id: NOT NULL + FK CASCADE applied (orphans=0, nulls=0).';
  ELSE
    RAISE NOTICE 'tasks table not present; skipping P0-6.';
  END IF;

  -- ---------------------------------------------------------------------
  -- org_compliance_status
  -- ---------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'org_compliance_status'
       AND column_name = 'organization_id'
  ) THEN
    SELECT count(*) INTO orphan_status
      FROM public.org_compliance_status s
     WHERE NOT EXISTS (
       SELECT 1 FROM public.organizations o WHERE o.id = s.organization_id
     );

    IF orphan_status > 0 THEN
      RAISE EXCEPTION
        'P0-7: cannot add FK on public.org_compliance_status.organization_id — % row(s) reference a non-existent organization. Clean them up first.',
        orphan_status;
    END IF;

    IF NOT EXISTS (
      SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_class p ON p.oid = c.confrelid
       WHERE c.contype = 'f'
         AND t.relname = 'org_compliance_status'
         AND p.relname = 'organizations'
    ) THEN
      ALTER TABLE public.org_compliance_status
        ADD CONSTRAINT org_compliance_status_organization_id_fkey
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE;
    END IF;

    RAISE NOTICE 'org_compliance_status.organization_id: FK CASCADE applied (orphans=0).';
  ELSE
    RAISE NOTICE 'org_compliance_status table not present; skipping P0-7.';
  END IF;
END $$;
