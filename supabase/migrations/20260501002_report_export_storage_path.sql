-- Storage path durability for report_export_jobs.
--
-- Background:
--   When a report export completes, lib/reports/export-jobs.ts writes a
--   1-hour Supabase signed URL into report_export_jobs.file_url. After
--   60 minutes that URL stops working — the export "rots" even though
--   the underlying file is still in the report-exports bucket. The
--   storage path is stashed in metadata->>'storagePath', but the status
--   route only returns file_url.
--
--   Audit P2 finding (#17 in the top-25 / §10 Report/Export Flows).
--
-- Fix:
--   Add typed storage_path / storage_bucket columns and backfill them
--   from metadata. The status route can then regenerate a fresh signed
--   URL on every request from the typed columns, so completed exports
--   stay downloadable indefinitely.
--
-- Idempotent — safe to re-run.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'report_export_jobs' AND c.relkind = 'r'
  ) THEN
    RAISE NOTICE 'report_export_jobs missing; skipping';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.report_export_jobs ADD COLUMN IF NOT EXISTS storage_path text';
  EXECUTE 'ALTER TABLE public.report_export_jobs ADD COLUMN IF NOT EXISTS storage_bucket text';

  -- Backfill from metadata where available. metadata->>'storagePath' and
  -- metadata->>'bucket' have been populated by the writer for some time;
  -- for older rows (pre-metadata) the typed columns just stay null and
  -- the status route falls back to the rotted file_url + a NOTICE in
  -- application logs.
  UPDATE public.report_export_jobs
  SET storage_path = COALESCE(storage_path, metadata->>'storagePath'),
      storage_bucket = COALESCE(storage_bucket, metadata->>'bucket')
  WHERE (storage_path IS NULL OR storage_bucket IS NULL)
    AND metadata IS NOT NULL
    AND jsonb_typeof(metadata) = 'object';
END$$;

COMMIT;
