-- Migration: idempotency token for org_form_submissions
--
-- The public submit page now sends a hidden UUID with the form data so a
-- double-click results in two POSTs that share the same token. The partial
-- unique index below collapses them to one row at the database layer; the
-- application catches the unique-violation and treats the second POST as
-- success.
--
-- Guarded by table-existence so fresh DBs that have not run the upstream
-- form-submissions migration no-op cleanly.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_form_submissions'
  ) THEN
    EXECUTE 'ALTER TABLE public.org_form_submissions ADD COLUMN IF NOT EXISTS submission_uuid uuid';
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS org_form_submissions_idem_uniq
        ON public.org_form_submissions (form_id, submission_uuid)
        WHERE submission_uuid IS NOT NULL
    $idx$;
  ELSE
    RAISE NOTICE 'org_form_submissions not present — skipping idempotency column';
  END IF;
END $$;
