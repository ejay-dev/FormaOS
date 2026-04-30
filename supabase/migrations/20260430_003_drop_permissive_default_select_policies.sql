-- Drop the permissive default SELECT policies that opened cross-tenant reads.
--
-- 20260122_add_default_rls_policies.sql added blanket policies of the shape
--
--     CREATE POLICY <table>_select ON public.<table>
--       FOR SELECT TO authenticated
--       USING (auth.uid() IS NOT NULL);
--
-- to ~30 tables that had RLS enabled without policies. For shared template /
-- reference tables (app_modules, billing_plans, care_industries, care_*_templates,
-- compliance_playbook_*, care_service_types, care_task_templates) this is
-- defensible — every authenticated user across all tenants legitimately reads
-- the same row set.
--
-- For ORG-DATA tables this is a P0 tenancy regression: any authenticated user
-- can SELECT rows that belong to any other organization. 20260405_fix_rls_organization_isolation.sql
-- added FOR ALL isolation policies for several of these but did NOT drop the
-- earlier permissive SELECT — and Postgres RLS is a UNION across policies, so
-- the permissive one still wins on SELECT.
--
-- This migration drops the permissive SELECT policies from the org-data
-- tables. The reference-data SELECT policies are left intact.
--
-- Tables losing the permissive policy here:
--   control_evidence, control_tasks, integration_events, memberships,
--   org_audit_log, org_certifications, org_entities, org_entity_members,
--   org_files, org_industries, org_memberships, org_registers,
--   policies, registers, report_generations, tasks, webhook_deliveries
--
-- After this migration, downstream callers that need SELECT on these tables
-- must rely on the org-membership-based FOR ALL policy from
-- 20260405_fix_rls_organization_isolation.sql or be granted via service role.
-- Any table where 20260405 did NOT add an isolation policy will become
-- effectively unreadable by users — by design — until a proper policy ships.
--
-- Audit P0 finding #1 in docs/deep-codebase-audit.md.

BEGIN;

DROP POLICY IF EXISTS control_evidence_select       ON public.control_evidence;
DROP POLICY IF EXISTS control_tasks_select          ON public.control_tasks;
DROP POLICY IF EXISTS integration_events_select     ON public.integration_events;
DROP POLICY IF EXISTS memberships_select            ON public.memberships;
DROP POLICY IF EXISTS org_audit_log_select          ON public.org_audit_log;
DROP POLICY IF EXISTS org_certifications_select     ON public.org_certifications;
DROP POLICY IF EXISTS org_entities_select           ON public.org_entities;
DROP POLICY IF EXISTS org_entity_members_select     ON public.org_entity_members;
DROP POLICY IF EXISTS org_files_select              ON public.org_files;
DROP POLICY IF EXISTS org_industries_select         ON public.org_industries;
DROP POLICY IF EXISTS org_memberships_select        ON public.org_memberships;
DROP POLICY IF EXISTS org_registers_select          ON public.org_registers;
DROP POLICY IF EXISTS policies_select               ON public.policies;
DROP POLICY IF EXISTS registers_select              ON public.registers;
DROP POLICY IF EXISTS report_generations_select     ON public.report_generations;
DROP POLICY IF EXISTS tasks_select                  ON public.tasks;
DROP POLICY IF EXISTS webhook_deliveries_select     ON public.webhook_deliveries;

-- Tables where 20260405 added an isolation policy that already covers SELECT
-- via FOR ALL: the drops above leave the isolation policy as the only
-- predicate (correct outcome).
--
-- Tables where no isolation policy was added: the drops above will block
-- non-service-role SELECT until a tenant policy ships. That is the intended
-- safe-by-default state. Operators should run, post-deploy:
--
--   SELECT schemaname, tablename, policyname
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN (
--       'control_evidence','control_tasks','integration_events','memberships',
--       'org_audit_log','org_certifications','org_entities','org_entity_members',
--       'org_files','org_industries','org_memberships','org_registers',
--       'policies','registers','report_generations','tasks','webhook_deliveries'
--     )
--   ORDER BY tablename, policyname;
--
-- and verify each table has at least one tenant-scoped policy. Where a
-- regression would block legitimate reads (e.g., the app needs to read
-- `tasks` for an org), add a FOR SELECT policy joining org_members.

COMMIT;
