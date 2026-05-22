-- Audit log entity typing (no backfill on immutable tables).
--
-- Background:
--   org_audit_logs already has an entity_id uuid column (added by
--   20250310_phase7_11_enterprise_controls.sql:176), but the writer in
--   app/app/actions/audit-events.ts crams entity_id into metadata and
--   constructs target='entityType:entityId' as a free-form string. The
--   audit-trail reader at /api/v1/audit-trail then filters with
--   target.eq.X OR target.like '%:Y', which is fragile and can't be
--   indexed efficiently.
--
--   Audit P1 finding #20 in docs/deep-codebase-audit.md.
--
-- This migration:
--   1. Adds public.org_audit_logs.entity_type text (sibling to entity_id).
--   2. Adds a composite index on (organization_id, entity_type, entity_id,
--      created_at DESC) for entity-scoped panel queries.
--   3. Attempts to backfill the typed columns from existing rows IF AND
--      ONLY IF the audit-log immutability trigger from
--      20250319_production_hardening.sql is NOT present. When that
--      trigger is in place (which it should be in production), the
--      historical rows stay as-is — they remain reachable via the
--      reader's legacy target-string fallback. The backfill is a
--      nice-to-have; the structural win is the typed columns + index for
--      all new writes from this point forward.
--
-- Idempotent and guarded — safe to re-run.

BEGIN;

DO $$
DECLARE
  has_metadata boolean;
  has_target boolean;
  has_entity_id boolean;
  immutability_trigger_present boolean;
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

  -- 2. Composite index for entity-panel lookups. created_at DESC matches
  --    the reader's ORDER BY clause.
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_org_audit_logs_entity_lookup '
       || 'ON public.org_audit_logs (organization_id, entity_type, entity_id, created_at DESC)';

  -- Detect the immutability trigger from 20250319_production_hardening.sql.
  -- If present, we MUST NOT issue UPDATE statements against
  -- org_audit_logs — the trigger raises "Audit records are immutable".
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.org_audit_logs'::regclass
      AND tgname = 'org_audit_logs_immutable'
      AND NOT tgisinternal
  ) INTO immutability_trigger_present;

  IF immutability_trigger_present THEN
    RAISE NOTICE
      'org_audit_logs_immutable trigger detected (audit immutability is a compliance feature, see 20250319_production_hardening.sql). Skipping historical backfill — typed columns will populate for all new writes from this point forward, and the audit-trail reader falls back to target-string filtering for older rows.';
    RETURN;
  END IF;

  -- Detect which optional columns this DB actually has.
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
    RAISE NOTICE 'org_audit_logs.entity_id missing; skipping backfill';
    RETURN;
  END IF;

  -- 3a. Backfill from metadata (only if column exists).
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
  END IF;

  -- 3b. Backfill from target='entityType:entityId' string convention.
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

    -- 3c. Older rows where target was a bare UUID.
    EXECUTE $SQL$
      UPDATE public.org_audit_logs
      SET entity_id = COALESCE(
            entity_id,
            (target)::uuid
          )
      WHERE entity_id IS NULL
        AND target ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    $SQL$;
  END IF;
END$$;

COMMIT;
