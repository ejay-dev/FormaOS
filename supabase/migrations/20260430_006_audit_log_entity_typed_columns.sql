-- Audit log entity typing + backfill.
--
-- Background:
--   org_audit_logs already has an entity_id uuid column (added by
--   20250310_phase7_11_enterprise_controls.sql:176), but the writer in
--   app/app/actions/audit-events.ts crams entity_id into metadata and
--   constructs target='entityType:entityId' as a free-form string. The
--   audit-trail reader at /api/v1/audit-trail then filters with
--   target.eq.X OR target.like '%:Y', which is fragile and can't be
--   indexed efficiently. Older rows whose target doesn't follow the
--   convention are silently invisible to entity panels.
--
--   Audit P1 finding #20 in docs/deep-codebase-audit.md.
--
-- This migration:
--   1. Adds public.org_audit_logs.entity_type text (sibling to entity_id).
--   2. Adds a composite index on (organization_id, entity_type, entity_id,
--      created_at DESC) for entity-scoped panel queries.
--   3. Backfills entity_type and entity_id from existing rows:
--      a. From metadata.entity_type / metadata.entity_id IF the metadata
--         column exists on this DB. (The writer puts hints there via the
--         stripUnsupportedColumn recovery path; not every environment has
--         the metadata column added by later migrations.)
--      b. From the legacy target='entityType:entityId' string for rows
--         that lack metadata-based hints but follow the convention.
--      c. From bare-UUID targets (oldest rows). Recovers entity_id only.
--      Rows whose target is action-shape (no colon) or system labels are
--      left with NULL typed columns; the reader will fall back to the
--      legacy target filter for those.
--
-- Idempotent and guarded — safe to re-run, no-op if the table is missing,
-- and each backfill block guards on the columns it actually touches.

BEGIN;

DO $$
DECLARE
  has_metadata boolean;
  has_target boolean;
  has_entity_id boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'org_audit_logs'
      AND c.relkind = 'r'
  ) THEN
    RAISE NOTICE 'org_audit_logs does not exist; skipping audit typing migration';
    RETURN;
  END IF;

  -- 1. Add the entity_type column. entity_id already exists from 20250310.
  EXECUTE 'ALTER TABLE public.org_audit_logs ADD COLUMN IF NOT EXISTS entity_type text';

  -- 2. Composite index for entity-panel lookups. created_at DESC matches the
  --    reader's ORDER BY clause.
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_org_audit_logs_entity_lookup '
       || 'ON public.org_audit_logs (organization_id, entity_type, entity_id, created_at DESC)';

  -- Detect which optional columns this DB actually has, so the backfill
  -- only touches what's available.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_audit_logs'
      AND column_name = 'metadata'
  ) INTO has_metadata;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_audit_logs'
      AND column_name = 'target'
  ) INTO has_target;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_audit_logs'
      AND column_name = 'entity_id'
  ) INTO has_entity_id;

  IF NOT has_entity_id THEN
    RAISE NOTICE 'org_audit_logs.entity_id missing; skipping all backfill (entity_id was added by 20250310_phase7_11_enterprise_controls.sql)';
    RETURN;
  END IF;

  -- 3a. Backfill from metadata where the writer has been stashing the
  --     values. Only runs if the metadata column actually exists on this DB.
  IF has_metadata THEN
    EXECUTE $SQL$
      UPDATE public.org_audit_logs
      SET entity_type = COALESCE(entity_type, metadata->>'entity_type'),
          entity_id   = COALESCE(
            entity_id,
            CASE
              WHEN metadata->>'entity_id' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                THEN (metadata->>'entity_id')::uuid
              ELSE NULL
            END
          )
      WHERE (entity_type IS NULL OR entity_id IS NULL)
        AND metadata IS NOT NULL
        AND jsonb_typeof(metadata) = 'object'
    $SQL$;
  ELSE
    RAISE NOTICE 'org_audit_logs.metadata missing; skipping metadata-based backfill';
  END IF;

  -- 3b. Backfill from target='entityType:entityId' string convention for
  --     rows still missing typed columns. Match strictly: lowercase ascii
  --     entity_type followed by ':' and a UUID.
  IF has_target THEN
    EXECUTE $SQL$
      UPDATE public.org_audit_logs
      SET entity_type = COALESCE(
            entity_type,
            substring(target FROM '^([a-z][a-z0-9_]*):')
          ),
          entity_id = COALESCE(
            entity_id,
            (substring(
              target
              FROM '^[a-z][a-z0-9_]*:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
            ))::uuid
          )
      WHERE (entity_type IS NULL OR entity_id IS NULL)
        AND target ~ '^[a-z][a-z0-9_]*:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    $SQL$;

    -- 3c. Older rows where target itself was just a bare UUID (pre-convention).
    --     We can recover entity_id but not entity_type — leave entity_type null
    --     and let the reader's legacy fallback handle these.
    EXECUTE $SQL$
      UPDATE public.org_audit_logs
      SET entity_id = COALESCE(
            entity_id,
            (target)::uuid
          )
      WHERE entity_id IS NULL
        AND target ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    $SQL$;
  ELSE
    RAISE NOTICE 'org_audit_logs.target missing; skipping target-based backfill';
  END IF;
END$$;

COMMIT;
