-- Allow org admins (not just owners) to view and create enterprise export jobs.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enterprise_export_jobs'
  ) THEN
    DROP POLICY IF EXISTS "enterprise_export_owner_select" ON public.enterprise_export_jobs;
    CREATE POLICY "enterprise_export_owner_select" ON public.enterprise_export_jobs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.organization_id = enterprise_export_jobs.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      );

    DROP POLICY IF EXISTS "enterprise_export_owner_insert" ON public.enterprise_export_jobs;
    CREATE POLICY "enterprise_export_owner_insert" ON public.enterprise_export_jobs
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.organization_id = enterprise_export_jobs.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

