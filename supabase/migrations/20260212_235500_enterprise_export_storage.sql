-- Adds storage location fields to enterprise_export_jobs so downloads can be
-- generated on-demand via signed URLs (instead of persisting an expiring link).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enterprise_export_jobs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'enterprise_export_jobs'
        AND column_name = 'storage_bucket'
    ) THEN
      ALTER TABLE public.enterprise_export_jobs
        ADD COLUMN storage_bucket text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'enterprise_export_jobs'
        AND column_name = 'storage_path'
    ) THEN
      ALTER TABLE public.enterprise_export_jobs
        ADD COLUMN storage_path text;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'enterprise_export_jobs'
        AND column_name = 'content_type'
    ) THEN
      ALTER TABLE public.enterprise_export_jobs
        ADD COLUMN content_type text NOT NULL DEFAULT 'application/zip';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_enterprise_export_storage_path
  ON public.enterprise_export_jobs(storage_path);

