-- =====================================================
-- FIX RLS POLICIES - ORGANIZATION ISOLATION
-- =====================================================
-- Migration Date: 2026-04-05
-- Priority: CRITICAL SECURITY FIX
--
-- Issue: 20+ tables have overly permissive RLS policies that allow
-- ANY authenticated user to SELECT all rows, breaking multi-tenant isolation.
--
-- Fix: Update all policies to check organization_id membership
-- via org_members table.
-- =====================================================

BEGIN;

-- =====================================================
-- CONTROL_EVIDENCE - Critical: Evidence should be org-isolated
-- =====================================================
DO $$
BEGIN
  -- Drop the weak policy
  DROP POLICY IF EXISTS "control_evidence_select" ON public.control_evidence;

  -- Create org-isolated policy
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'control_evidence'
  ) THEN
    CREATE POLICY "control_evidence_org_isolation"
      ON public.control_evidence
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- CONTROL_TASKS - Critical: Tasks should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "control_tasks_select" ON public.control_tasks;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'control_tasks'
  ) THEN
    CREATE POLICY "control_tasks_org_isolation"
      ON public.control_tasks
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_CERTIFICATIONS - Critical: Certifications should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_certifications_select" ON public.org_certifications;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_certifications'
  ) THEN
    CREATE POLICY "org_certifications_org_isolation"
      ON public.org_certifications
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_ENTITIES - Critical: Organization entities should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_entities_select" ON public.org_entities;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_entities'
  ) THEN
    CREATE POLICY "org_entities_org_isolation"
      ON public.org_entities
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_ENTITY_MEMBERS - Critical: Entity membership should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_entity_members_select" ON public.org_entity_members;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_entity_members'
  ) THEN
    CREATE POLICY "org_entity_members_org_isolation"
      ON public.org_entity_members
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_MEMBERSHIPS - Critical: Membership data should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_memberships_select" ON public.org_memberships;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_memberships'
  ) THEN
    CREATE POLICY "org_memberships_org_isolation"
      ON public.org_memberships
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_REGISTERS - Critical: Registers should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_registers_select" ON public.org_registers;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_registers'
  ) THEN
    CREATE POLICY "org_registers_org_isolation"
      ON public.org_registers
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_MODULE_ENTITLEMENTS - Critical: Entitlements should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_module_entitlements_select" ON public.org_module_entitlements;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_module_entitlements'
  ) THEN
    CREATE POLICY "org_module_entitlements_org_isolation"
      ON public.org_module_entitlements
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_INDUSTRIES - Org-specific industry data
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_industries_select" ON public.org_industries;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_industries'
  ) THEN
    CREATE POLICY "org_industries_org_isolation"
      ON public.org_industries
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- POLICIES TABLE - Policy documents should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "policies_select" ON public.policies;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'policies'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'policies'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "policies_org_isolation"
      ON public.policies
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- TASKS TABLE - Tasks should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "tasks_select" ON public.tasks;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasks'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tasks'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "tasks_org_isolation"
      ON public.tasks
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- REGISTERS TABLE - Registers should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "registers_select" ON public.registers;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'registers'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'registers'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "registers_org_isolation"
      ON public.registers
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- REPORT_GENERATIONS - Reports should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "report_generations_select" ON public.report_generations;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'report_generations'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'report_generations'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "report_generations_org_isolation"
      ON public.report_generations
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- INTEGRATION_EVENTS - Integration events should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "integration_events_select" ON public.integration_events;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'integration_events'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'integration_events'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "integration_events_org_isolation"
      ON public.integration_events
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- MEMBERSHIPS - Alternative membership table
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "memberships_select" ON public.memberships;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'memberships'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'memberships'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "memberships_org_isolation"
      ON public.memberships
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- ORG_AUDIT_LOG - Legacy audit log table
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_audit_log_select" ON public.org_audit_log;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_audit_log'
  ) THEN
    CREATE POLICY "org_audit_log_org_isolation"
      ON public.org_audit_log
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- WEBHOOK_DELIVERIES - Webhook data should be org-isolated
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "webhook_deliveries_select" ON public.webhook_deliveries;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webhook_deliveries'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'webhook_deliveries'
      AND column_name = 'organization_id'
    )
  ) THEN
    CREATE POLICY "webhook_deliveries_org_isolation"
      ON public.webhook_deliveries
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- READ-ONLY REFERENCE TABLES
-- These tables contain shared data (frameworks, templates, plans)
-- and should remain accessible to all authenticated users
-- =====================================================

-- These are correct as-is (shared reference data):
-- - app_modules (platform features)
-- - billing_plans (public pricing)
-- - care_industries (reference data)
-- - care_policy_templates (shared templates)
-- - care_register_templates (shared templates)
-- - care_service_types (reference data)
-- - care_task_templates (shared templates)
-- - compliance_playbook_controls (framework controls)
-- - compliance_playbooks (framework playbooks)
-- - rbac_permissions (permissions catalog)
-- - rbac_role_permissions (role definitions)
-- - rbac_roles (role catalog)

-- These tables intentionally have permissive policies because they're
-- reference data, not organization-specific data.

COMMIT;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify organization isolation is working:
--
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename LIKE 'org_%'
-- ORDER BY tablename, policyname;
-- =====================================================
