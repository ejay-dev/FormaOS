-- Restrict enterprise export job updates to service role only
-- Prevent authenticated users from updating export job rows

DROP POLICY IF EXISTS "enterprise_export_service_update" ON public.enterprise_export_jobs;
CREATE POLICY "enterprise_export_service_update" ON public.enterprise_export_jobs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

