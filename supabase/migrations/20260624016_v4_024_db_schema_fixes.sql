-- v4-024: DB schema fixes flagged by the static audit.
--
-- 1. evidence_update storage policy was missing WITH CHECK, so a
--    legitimate file owner could rewrite the storage path to another
--    org's prefix on update. Add a WITH CHECK identical to the USING
--    clause so the rewritten path still belongs to a member-owned org.
--
-- 2. security_audit_log.organization_id is NULLABLE but the RLS
--    SELECT policy requires `om.organization_id = security_audit_log.
--    organization_id` — a row with NULL org_id is unreadable by anyone
--    other than service_role. That means pre-login security events
--    (failed signin attempts before an org is resolved) silently
--    disappear from owner audit dashboards. Backfill with the
--    'platform' sentinel org (created here if missing) and SET NOT NULL.
--
-- 3. The `at_risk_credentials` and `form_analytics` views reference
--    tables that don't exist (org_credentials, public.forms). Any
--    SELECT against them throws. Recreate against the actual tables
--    (org_staff_credentials, org_forms).
--
-- 4. public.memberships baseline table has both `organization_id` and
--    `org_id` columns, neither indexed or FK'd, neither used by app
--    code. Drop the redundant `org_id` column and add a FK on
--    organization_id so it can never silently fork from organizations.
--
-- 5. api_key_usage_log_service_insert was restored in v4-023; add a
--    matching role-scoped READ policy so non-service callers can never
--    SELECT another tenant's usage events without org_members context.

-- ------------------------------------------------------------------
-- 1. evidence_update WITH CHECK
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "evidence_update" ON storage.objects;
CREATE POLICY "evidence_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  )
  WITH CHECK (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

-- ------------------------------------------------------------------
-- 2. security_audit_log.organization_id NOT NULL
-- ------------------------------------------------------------------
-- Create a sentinel "platform" org for pre-login events so the NOT
-- NULL constraint can be enforced without losing failed-signin rows.
-- Using a fixed UUID so the sentinel is stable across environments
-- and easy to filter in dashboards.
INSERT INTO public.organizations (id, name, plan_key, created_at)
VALUES (
  '00000000-0000-0000-0000-00000000f0f0',
  '__platform_sentinel__',
  NULL,
  now()
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.security_audit_log
SET organization_id = '00000000-0000-0000-0000-00000000f0f0'
WHERE organization_id IS NULL;

ALTER TABLE public.security_audit_log
  ALTER COLUMN organization_id SET NOT NULL;

-- ------------------------------------------------------------------
-- 3. Fix broken views (at_risk_credentials, form_analytics)
-- ------------------------------------------------------------------
DROP VIEW IF EXISTS public.at_risk_credentials;
CREATE VIEW public.at_risk_credentials
WITH (security_invoker = true) AS
SELECT
  oc.id,
  oc.organization_id,
  oc.user_id,
  oc.expiry_date,
  upp.full_name AS staff_name,
  NULL::text AS staff_avatar
FROM public.org_staff_credentials oc
LEFT JOIN public.user_profiles_public upp
  ON upp.user_id = oc.user_id
 AND upp.organization_id = oc.organization_id
WHERE oc.expiry_date BETWEEN now() AND now() + interval '30 days';

REVOKE ALL ON public.at_risk_credentials FROM PUBLIC;
GRANT SELECT ON public.at_risk_credentials TO authenticated;

DROP VIEW IF EXISTS public.form_analytics;
CREATE VIEW public.form_analytics
WITH (security_invoker = true) AS
SELECT
  f.id AS form_id,
  f.org_id AS organization_id,
  f.title,
  f.status,
  f.created_at,
  COUNT(fr.id) AS response_count,
  MAX(fr.created_at) AS last_response_at
FROM public.org_forms f
LEFT JOIN public.form_responses fr
  ON fr.form_id = f.id
GROUP BY
  f.id,
  f.org_id,
  f.title,
  f.status,
  f.created_at;

REVOKE ALL ON public.form_analytics FROM PUBLIC;
GRANT SELECT ON public.form_analytics TO authenticated;

-- ------------------------------------------------------------------
-- 4. memberships table consolidation
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'memberships'
      AND column_name = 'org_id'
  ) THEN
    -- Backfill organization_id from org_id where the former is null.
    UPDATE public.memberships
    SET organization_id = org_id
    WHERE organization_id IS NULL AND org_id IS NOT NULL;

    ALTER TABLE public.memberships DROP COLUMN org_id;
  END IF;
END $$;

-- Add FK + NOT NULL on organization_id and user_id now that the
-- table only has one canonical column for each.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'memberships'
      AND column_name = 'organization_id'
      AND is_nullable = 'YES'
  ) THEN
    DELETE FROM public.memberships WHERE organization_id IS NULL OR user_id IS NULL;
    ALTER TABLE public.memberships ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN user_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memberships_organization_id_fkey'
  ) THEN
    ALTER TABLE public.memberships
      ADD CONSTRAINT memberships_organization_id_fkey
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ------------------------------------------------------------------
-- 5. api_key_usage_log_service_select — role-scoped SELECT policy
-- ------------------------------------------------------------------
-- Existing INSERT was restored in v4-023; ensure SELECT is also
-- scoped (service_role can read all, members can read their org's
-- rows via the api_keys join).
DROP POLICY IF EXISTS api_key_usage_log_org_select ON public.api_key_usage_log;
CREATE POLICY api_key_usage_log_org_select
  ON public.api_key_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.api_keys k
      JOIN public.org_members om ON om.organization_id = k.organization_id
      WHERE k.id = api_key_usage_log.api_key_id
        AND om.user_id = auth.uid()
    )
  );
