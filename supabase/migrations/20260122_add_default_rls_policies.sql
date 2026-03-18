-- 20260122_add_default_rls_policies.sql
-- Adds a default SELECT RLS policy for all tables with RLS enabled but no policies


BEGIN;

-- Default: allow SELECT only for authenticated users

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_modules' AND policyname = 'app_modules_select'
  ) THEN
    EXECUTE $$CREATE POLICY app_modules_select ON public.app_modules FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_plans' AND policyname = 'billing_plans_select'
  ) THEN
    EXECUTE $$CREATE POLICY billing_plans_select ON public.billing_plans FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'care_industries' AND policyname = 'care_industries_select'
  ) THEN
    EXECUTE $$CREATE POLICY care_industries_select ON public.care_industries FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'care_policy_templates' AND policyname = 'care_policy_templates_select'
  ) THEN
    EXECUTE $$CREATE POLICY care_policy_templates_select ON public.care_policy_templates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'care_register_templates' AND policyname = 'care_register_templates_select'
  ) THEN
    EXECUTE $$CREATE POLICY care_register_templates_select ON public.care_register_templates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'care_service_types' AND policyname = 'care_service_types_select'
  ) THEN
    EXECUTE $$CREATE POLICY care_service_types_select ON public.care_service_types FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'care_task_templates' AND policyname = 'care_task_templates_select'
  ) THEN
    EXECUTE $$CREATE POLICY care_task_templates_select ON public.care_task_templates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'compliance_playbook_controls' AND policyname = 'compliance_playbook_controls_select'
  ) THEN
    EXECUTE $$CREATE POLICY compliance_playbook_controls_select ON public.compliance_playbook_controls FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'compliance_playbooks' AND policyname = 'compliance_playbooks_select'
  ) THEN
    EXECUTE $$CREATE POLICY compliance_playbooks_select ON public.compliance_playbooks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'control_evidence' AND policyname = 'control_evidence_select'
  ) THEN
    EXECUTE $$CREATE POLICY control_evidence_select ON public.control_evidence FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'control_tasks' AND policyname = 'control_tasks_select'
  ) THEN
    EXECUTE $$CREATE POLICY control_tasks_select ON public.control_tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'integration_events' AND policyname = 'integration_events_select'
  ) THEN
    EXECUTE $$CREATE POLICY integration_events_select ON public.integration_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'memberships' AND policyname = 'memberships_select'
  ) THEN
    EXECUTE $$CREATE POLICY memberships_select ON public.memberships FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_audit_log' AND policyname = 'org_audit_log_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_audit_log_select ON public.org_audit_log FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_certifications' AND policyname = 'org_certifications_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_certifications_select ON public.org_certifications FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_entities' AND policyname = 'org_entities_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_entities_select ON public.org_entities FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_entity_members' AND policyname = 'org_entity_members_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_entity_members_select ON public.org_entity_members FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_files' AND policyname = 'org_files_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_files_select ON public.org_files FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_industries' AND policyname = 'org_industries_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_industries_select ON public.org_industries FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_memberships' AND policyname = 'org_memberships_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_memberships_select ON public.org_memberships FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_module_entitlements' AND policyname = 'org_module_entitlements_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_module_entitlements_select ON public.org_module_entitlements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_registers' AND policyname = 'org_registers_select'
  ) THEN
    EXECUTE $$CREATE POLICY org_registers_select ON public.org_registers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'policies' AND policyname = 'policies_select'
  ) THEN
    EXECUTE $$CREATE POLICY policies_select ON public.policies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rbac_permissions' AND policyname = 'rbac_permissions_select'
  ) THEN
    EXECUTE $$CREATE POLICY rbac_permissions_select ON public.rbac_permissions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rbac_role_permissions' AND policyname = 'rbac_role_permissions_select'
  ) THEN
    EXECUTE $$CREATE POLICY rbac_role_permissions_select ON public.rbac_role_permissions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rbac_roles' AND policyname = 'rbac_roles_select'
  ) THEN
    EXECUTE $$CREATE POLICY rbac_roles_select ON public.rbac_roles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'registers' AND policyname = 'registers_select'
  ) THEN
    EXECUTE $$CREATE POLICY registers_select ON public.registers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_generations' AND policyname = 'report_generations_select'
  ) THEN
    EXECUTE $$CREATE POLICY report_generations_select ON public.report_generations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_select'
  ) THEN
    EXECUTE $$CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_deliveries' AND policyname = 'webhook_deliveries_select'
  ) THEN
    EXECUTE $$CREATE POLICY webhook_deliveries_select ON public.webhook_deliveries FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);$$;
  END IF;
END$$;

COMMIT;
