-- Align forms RLS settings key with application code.
--
-- The forms platform RLS at 20260402_forms_platform.sql:84-94 (and the
-- idempotent re-creation at 20260426_001_ensure_forms_platform_schema.sql:127-135)
-- reads (settings->>'requires_auth')::boolean to decide whether anonymous
-- inserts into org_form_submissions are allowed. The application code in
-- lib/forms/form-store.ts writes the same concept under the JSON key
-- requireAuthentication (camelCase). Since the SQL path looks for snake_case
-- and never finds it, the OR clause defaults to "not true" → public insert is
-- effectively always permitted, regardless of the form author's intent.
--
-- Audit P1 finding #6 in docs/deep-codebase-audit.md.
--
-- This migration:
--   1. Backfills existing org_forms.settings rows so requires_auth mirrors
--      requireAuthentication where the camelCase key is the source of truth.
--   2. Re-creates the org_form_submissions INSERT policy to read EITHER key,
--      so a future code-only fix to standardize on requires_auth doesn't
--      regress in-flight forms.
--
-- Idempotency: guarded so the migration is a no-op against environments
-- where the forms platform tables were never created.

BEGIN;

DO $$
BEGIN
  -- Backfill org_forms.settings if the table exists.
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'org_forms'
      AND c.relkind = 'r'
  ) THEN
    UPDATE public.org_forms
    SET settings = jsonb_set(
          COALESCE(settings, '{}'::jsonb),
          '{requires_auth}',
          to_jsonb(COALESCE((settings->>'requireAuthentication')::boolean, false)),
          true
        )
    WHERE settings ? 'requireAuthentication'
      AND NOT settings ? 'requires_auth';
  ELSE
    RAISE NOTICE 'org_forms does not exist; skipping settings backfill';
  END IF;

  -- Re-create org_form_submissions INSERT policy if that table exists.
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'org_form_submissions'
      AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS org_form_submissions_insert ON public.org_form_submissions';
    EXECUTE $POLICY$
      CREATE POLICY org_form_submissions_insert
        ON public.org_form_submissions
        FOR INSERT
        WITH CHECK (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1
            FROM public.org_forms f
            WHERE f.id = form_id
              AND f.status = 'published'
              AND COALESCE(
                    (f.settings->>'requires_auth')::boolean,
                    (f.settings->>'requireAuthentication')::boolean,
                    false
                  ) IS NOT TRUE
          )
        )
    $POLICY$;
  ELSE
    RAISE NOTICE 'org_form_submissions does not exist; skipping policy update';
  END IF;
END$$;

COMMIT;
