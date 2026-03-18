BEGIN;

-- =====================================================
-- 0. Hard reset problematic views (clean dependency graph)
-- =====================================================
DROP VIEW IF EXISTS public.at_risk_credentials CASCADE;
DROP VIEW IF EXISTS public.form_analytics CASCADE;
DROP VIEW IF EXISTS public.api_health CASCADE;
DROP VIEW IF EXISTS public.compliance_status CASCADE;
DROP VIEW IF EXISTS public.user_profiles_public CASCADE;

-- =====================================================
-- 1. Sanitized public user profiles (NO auth.users)
-- =====================================================
CREATE VIEW public.user_profiles_public
WITH (security_invoker = true) AS
SELECT
  up.user_id,
  up.organization_id,
  up.full_name,
  up.created_at,
  up.updated_at
FROM public.user_profiles up;

REVOKE ALL ON public.user_profiles_public FROM PUBLIC;
GRANT SELECT ON public.user_profiles_public TO authenticated;

-- =====================================================
-- 2. Compliance status (explicit aggregation)
-- =====================================================
CREATE VIEW public.compliance_status
WITH (security_invoker = true) AS
SELECT
  cs.organization_id,
  cs.framework,
  cs.compliance_score,
  cs.completed_at,
  cs.non_compliant,
  COUNT(sf.id) AS critical_findings
FROM public.compliance_scans cs
LEFT JOIN public.scan_findings sf
  ON sf.scan_id = cs.id AND sf.severity = 'critical'
GROUP BY
  cs.id,
  cs.organization_id,
  cs.framework,
  cs.compliance_score,
  cs.completed_at,
  cs.non_compliant;

REVOKE ALL ON public.compliance_status FROM PUBLIC;
GRANT SELECT ON public.compliance_status TO authenticated;

-- =====================================================
-- 3. API health metrics
-- =====================================================
CREATE VIEW public.api_health
WITH (security_invoker = true) AS
SELECT
  organization_id,
  DATE(timestamp) AS date,
  COUNT(*) AS total_requests,
  AVG(response_time) AS avg_response_time,
  COUNT(*) FILTER (WHERE status_code >= 500) AS server_errors,
  COUNT(*) FILTER (WHERE status_code BETWEEN 400 AND 499) AS client_errors,
  COUNT(*) FILTER (WHERE status_code BETWEEN 200 AND 299) AS successful_requests
FROM public.api_usage_logs
GROUP BY organization_id, DATE(timestamp);

REVOKE ALL ON public.api_health FROM PUBLIC;
GRANT SELECT ON public.api_health TO authenticated;

-- =====================================================
-- 4. At-risk credentials (explicit, stable schema)
-- =====================================================
CREATE VIEW public.at_risk_credentials
WITH (security_invoker = true) AS
SELECT
  oc.id,
  oc.organization_id,
  oc.user_id,
  oc.expiry_date,
  upp.full_name AS staff_name,
  NULL::text AS staff_avatar
FROM public.org_credentials oc
LEFT JOIN public.user_profiles_public upp
  ON upp.user_id = oc.user_id
 AND upp.organization_id = oc.organization_id
WHERE oc.expiry_date BETWEEN now() AND now() + interval '30 days';

REVOKE ALL ON public.at_risk_credentials FROM PUBLIC;
GRANT SELECT ON public.at_risk_credentials TO authenticated;

-- =====================================================
-- 5. Form analytics (static columns only)
-- =====================================================
CREATE VIEW public.form_analytics
WITH (security_invoker = true) AS
SELECT
  f.id AS form_id,
  f.organization_id,
  f.title,
  f.status,
  f.created_at,
  COUNT(fr.id) AS response_count,
  MAX(fr.created_at) AS last_response_at
FROM public.forms f
LEFT JOIN public.form_responses fr
  ON fr.form_id = f.id
GROUP BY
  f.id,
  f.organization_id,
  f.title,
  f.status,
  f.created_at;

REVOKE ALL ON public.form_analytics FROM PUBLIC;
GRANT SELECT ON public.form_analytics TO authenticated;

COMMIT;

-- =====================================================
-- 6. Enable RLS on public tables flagged by Supabase linter
-- =====================================================
ALTER TABLE public.care_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_register_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_module_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_entity_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_playbook_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_tasks ENABLE ROW LEVEL SECURITY;
