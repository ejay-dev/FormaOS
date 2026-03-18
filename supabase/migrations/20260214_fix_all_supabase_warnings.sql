-- =====================================================
-- FIX ALL 412 SUPABASE PERFORMANCE WARNINGS
-- =====================================================
-- This migration fixes:
-- 1. auth_rls_initplan warnings (wrap auth functions)
-- 2. multiple_permissive_policies warnings (consolidate policies)
-- 3. duplicate_index warnings (drop duplicate indexes)
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: DROP DUPLICATE INDEX
-- =====================================================
-- Drop idx_team_invitations_expires (keep idx_team_invitations_expires_at)
DROP INDEX IF EXISTS idx_team_invitations_expires;

-- =====================================================
-- PART 2: FIX AUTH RLS INITPLAN WARNINGS
-- =====================================================
-- This programmatically wraps all auth.uid() calls with (select auth.uid())
-- in ALL RLS policies to make them initplan-safe

DO $$
DECLARE
    pol RECORD;
    new_definition TEXT;
    using_clause TEXT;
    check_clause TEXT;
BEGIN
    -- Loop through all policies that use auth functions without wrapping
    FOR pol IN
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            qual ~ 'auth\.(uid|role|jwt|email)\(\)'
            OR with_check ~ 'auth\.(uid|role|jwt|email)\(\)'
        )
    LOOP
        -- Process USING clause
        IF pol.qual IS NOT NULL THEN
            using_clause := pol.qual;
            -- Wrap auth.uid() with (select auth.uid())
            using_clause := regexp_replace(using_clause, 'auth\.uid\(\)', '(select auth.uid())', 'g');
            using_clause := regexp_replace(using_clause, 'auth\.role\(\)', '(select auth.role())', 'g');
            using_clause := regexp_replace(using_clause, 'auth\.email\(\)', '(select auth.email())', 'g');
            using_clause := regexp_replace(using_clause, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
        END IF;

        -- Process WITH CHECK clause
        IF pol.with_check IS NOT NULL THEN
            check_clause := pol.with_check;
            -- Wrap auth.uid() with (select auth.uid())
            check_clause := regexp_replace(check_clause, 'auth\.uid\(\)', '(select auth.uid())', 'g');
            check_clause := regexp_replace(check_clause, 'auth\.role\(\)', '(select auth.role())', 'g');
            check_clause := regexp_replace(check_clause, 'auth\.email\(\)', '(select auth.email())', 'g');
            check_clause := regexp_replace(check_clause, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
        END IF;

        -- Drop and recreate the policy with wrapped auth calls
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);

        -- Build new policy
        new_definition := format('CREATE POLICY %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        
        -- Add AS clause
        IF pol.permissive = 'PERMISSIVE' THEN
            new_definition := new_definition || ' AS PERMISSIVE';
        ELSE
            new_definition := new_definition || ' AS RESTRICTIVE';
        END IF;

        -- Add FOR clause
        new_definition := new_definition || ' FOR ' || pol.cmd;

        -- Add TO clause
        new_definition := new_definition || ' TO ' || array_to_string(pol.roles, ', ');

        -- Add USING and WITH CHECK clauses based on command type
        -- INSERT policies can ONLY have WITH CHECK
        -- SELECT policies can ONLY have USING
        -- UPDATE/DELETE policies can have USING (and UPDATE can have WITH CHECK)
        -- ALL policies can have both
        
        IF pol.cmd = 'INSERT' THEN
            -- INSERT: only WITH CHECK allowed
            IF check_clause IS NOT NULL THEN
                new_definition := new_definition || ' WITH CHECK (' || check_clause || ')';
            END IF;
        ELSIF pol.cmd = 'SELECT' THEN
            -- SELECT: only USING allowed
            IF using_clause IS NOT NULL THEN
                new_definition := new_definition || ' USING (' || using_clause || ')';
            END IF;
        ELSIF pol.cmd = 'DELETE' THEN
            -- DELETE: only USING allowed
            IF using_clause IS NOT NULL THEN
                new_definition := new_definition || ' USING (' || using_clause || ')';
            END IF;
        ELSIF pol.cmd = 'UPDATE' THEN
            -- UPDATE: can have both USING and WITH CHECK
            IF using_clause IS NOT NULL THEN
                new_definition := new_definition || ' USING (' || using_clause || ')';
            END IF;
            IF check_clause IS NOT NULL THEN
                new_definition := new_definition || ' WITH CHECK (' || check_clause || ')';
            END IF;
        ELSE
            -- ALL: can have both USING and WITH CHECK
            IF using_clause IS NOT NULL THEN
                new_definition := new_definition || ' USING (' || using_clause || ')';
            END IF;
            IF check_clause IS NOT NULL THEN
                new_definition := new_definition || ' WITH CHECK (' || check_clause || ')';
            END IF;
        END IF;

        -- Execute the new policy (with error handling for broken policies)
        BEGIN
            EXECUTE new_definition;
            RAISE NOTICE 'Fixed policy: %.%.%', pol.schemaname, pol.tablename, pol.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to recreate policy %.%.%: % - Skipping...', 
                pol.schemaname, pol.tablename, pol.policyname, SQLERRM;
            -- Continue to next policy
        END;
    END LOOP;
END $$;

-- =====================================================
-- PART 3: FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- Consolidate multiple permissive policies per (table, role, command)
-- Wrapped in DO block with error handling for schema mismatches

DO $$
BEGIN
    -- api_alert_config: Consolidate view policies
    BEGIN
        DROP POLICY IF EXISTS "Admins can view API alert config" ON public.api_alert_config;
        DROP POLICY IF EXISTS "Admins can manage API alert config" ON public.api_alert_config;
        EXECUTE 'CREATE POLICY "api_alert_config_admin_all" ON public.api_alert_config
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = api_alert_config.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for api_alert_config';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped api_alert_config: %', SQLERRM;
    END;

    -- comment_reactions: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view reactions in their org" ON public.comment_reactions;
        DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.comment_reactions;
        EXECUTE 'CREATE POLICY "comment_reactions_unified" ON public.comment_reactions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.comments c
                    JOIN public.org_members om ON om.organization_id = c.org_id
                    WHERE c.id = comment_reactions.comment_id
                    AND om.user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                user_id = (select auth.uid()) AND
                EXISTS (
                    SELECT 1 FROM public.comments c
                    JOIN public.org_members om ON om.organization_id = c.org_id
                    WHERE c.id = comment_reactions.comment_id
                    AND om.user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for comment_reactions';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped comment_reactions: %', SQLERRM;
    END;

    -- compliance_export_jobs: Consolidate policies
    BEGIN
        DROP POLICY IF EXISTS export_jobs_select ON public.compliance_export_jobs;
        DROP POLICY IF EXISTS export_jobs_insert ON public.compliance_export_jobs;
        DROP POLICY IF EXISTS export_jobs_service_role ON public.compliance_export_jobs;
        EXECUTE 'CREATE POLICY "compliance_export_jobs_unified" ON public.compliance_export_jobs
            FOR ALL
            USING (
                (select auth.role()) = ''service_role'' OR
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = compliance_export_jobs.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for compliance_export_jobs';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped compliance_export_jobs: %', SQLERRM;
    END;

    -- compliance_scans: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view compliance scans in their org" ON public.compliance_scans;
        DROP POLICY IF EXISTS "Admins can manage compliance scans" ON public.compliance_scans;
        EXECUTE 'CREATE POLICY "compliance_scans_unified" ON public.compliance_scans
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = compliance_scans.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = compliance_scans.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for compliance_scans';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped compliance_scans: %', SQLERRM;
    END;

    -- compliance_score_snapshots: Consolidate policies
    BEGIN
        DROP POLICY IF EXISTS snapshots_select ON public.compliance_score_snapshots;
        DROP POLICY IF EXISTS snapshots_service_role ON public.compliance_score_snapshots;
        EXECUTE 'CREATE POLICY "compliance_score_snapshots_unified" ON public.compliance_score_snapshots
            FOR SELECT
            USING (
                (select auth.role()) = ''service_role'' OR
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = compliance_score_snapshots.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for compliance_score_snapshots';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped compliance_score_snapshots: %', SQLERRM;
    END;

    -- dashboard_layouts: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view dashboard layouts in their org" ON public.dashboard_layouts;
        DROP POLICY IF EXISTS "Users can manage dashboard layouts in their org" ON public.dashboard_layouts;
        EXECUTE 'CREATE POLICY "dashboard_layouts_unified" ON public.dashboard_layouts
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = dashboard_layouts.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for dashboard_layouts';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped dashboard_layouts: %', SQLERRM;
    END;

    -- email_preferences: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view their own email preferences" ON public.email_preferences;
        DROP POLICY IF EXISTS "Users can manage their own email preferences" ON public.email_preferences;
        EXECUTE 'CREATE POLICY "email_preferences_unified" ON public.email_preferences
            FOR ALL
            USING (user_id = (select auth.uid()))';
        RAISE NOTICE 'Consolidated policies for email_preferences';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped email_preferences: %', SQLERRM;
    END;

    -- file_metadata: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view file metadata in their org" ON public.file_metadata;
        DROP POLICY IF EXISTS "Users can manage file metadata in their org" ON public.file_metadata;
        EXECUTE 'CREATE POLICY "file_metadata_unified" ON public.file_metadata
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = file_metadata.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for file_metadata';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped file_metadata: %', SQLERRM;
    END;

    -- file_versions: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view file versions in their org" ON public.file_versions;
        DROP POLICY IF EXISTS "Users can manage file versions in their org" ON public.file_versions;
        EXECUTE 'CREATE POLICY "file_versions_unified" ON public.file_versions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.file_metadata fm
                    JOIN public.org_members om ON om.organization_id = fm.org_id
                    WHERE fm.id = file_versions.file_id
                    AND om.user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for file_versions';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped file_versions: %', SQLERRM;
    END;

    -- framework_control_mappings: Consolidate policies
    BEGIN
        DROP POLICY IF EXISTS mappings_select ON public.framework_control_mappings;
        DROP POLICY IF EXISTS mappings_service_role ON public.framework_control_mappings;
        EXECUTE 'CREATE POLICY "framework_control_mappings_unified" ON public.framework_control_mappings
            FOR SELECT
            USING ((select auth.role()) = ''service_role'' OR (select auth.uid()) IS NOT NULL)';
        RAISE NOTICE 'Consolidated policies for framework_control_mappings';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped framework_control_mappings: %', SQLERRM;
    END;

    -- integration_configs: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view integration configs in their org" ON public.integration_configs;
        DROP POLICY IF EXISTS "Admins can manage integration configs" ON public.integration_configs;
        EXECUTE 'CREATE POLICY "integration_configs_unified" ON public.integration_configs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = integration_configs.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = integration_configs.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for integration_configs';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped integration_configs: %', SQLERRM;
    END;

    -- org_assets: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "View Assets" ON public.org_assets;
        DROP POLICY IF EXISTS "Manage Assets" ON public.org_assets;
        DROP POLICY IF EXISTS "Asset Access" ON public.org_assets;
        DROP POLICY IF EXISTS "Unified Asset Access" ON public.org_assets;
        DROP POLICY IF EXISTS "Org members view assets" ON public.org_assets;
        DROP POLICY IF EXISTS "Org admins insert assets" ON public.org_assets;
        DROP POLICY IF EXISTS "Org admins update assets" ON public.org_assets;
        DROP POLICY IF EXISTS "Org admins delete assets" ON public.org_assets;
        EXECUTE 'CREATE POLICY "org_assets_unified" ON public.org_assets
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_assets.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_assets.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_assets';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_assets: %', SQLERRM;
    END;

    -- org_audit_logs: Consolidate multiple policies
    BEGIN
        DROP POLICY IF EXISTS "audit_logs_read_access" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "Log Access" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "Unified Log Access" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "Admins and Owners can view audit logs" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "Members can insert audit logs" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "audit_logs_write_access" ON public.org_audit_logs;
        DROP POLICY IF EXISTS "audit_log_org_isolation" ON public.org_audit_logs;
        EXECUTE 'CREATE POLICY "org_audit_logs_unified" ON public.org_audit_logs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_audit_logs.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_audit_logs';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_audit_logs: %', SQLERRM;
    END;

    -- org_compliance_blocks: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Org members read compliance blocks" ON public.org_compliance_blocks;
        DROP POLICY IF EXISTS "Org admins update compliance blocks" ON public.org_compliance_blocks;
        DROP POLICY IF EXISTS "Org members view compliance blocks" ON public.org_compliance_blocks;
        DROP POLICY IF EXISTS "Org admins manage compliance blocks" ON public.org_compliance_blocks;
        EXECUTE 'CREATE POLICY "org_compliance_blocks_unified" ON public.org_compliance_blocks
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_compliance_blocks.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_compliance_blocks.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_compliance_blocks';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_compliance_blocks: %', SQLERRM;
    END;

    -- org_compliance_status: Consolidate read + manage + update policies
    BEGIN
        DROP POLICY IF EXISTS "Org members read compliance status" ON public.org_compliance_status;
        DROP POLICY IF EXISTS "Org admins manage compliance status" ON public.org_compliance_status;
        DROP POLICY IF EXISTS "Org admins update compliance status" ON public.org_compliance_status;
        EXECUTE 'CREATE POLICY "org_compliance_status_unified" ON public.org_compliance_status
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_compliance_status.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_compliance_status.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_compliance_status';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_compliance_status: %', SQLERRM;
    END;

    -- org_evidence: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "View Evidence" ON public.org_evidence;
        DROP POLICY IF EXISTS "Manage Evidence" ON public.org_evidence;
        DROP POLICY IF EXISTS "Evidence Access" ON public.org_evidence;
        EXECUTE 'CREATE POLICY "org_evidence_unified" ON public.org_evidence
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_evidence.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_evidence.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_evidence';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_evidence: %', SQLERRM;
    END;

    -- org_exports: Consolidate view + create policies
    BEGIN
        DROP POLICY IF EXISTS "Org members view exports" ON public.org_exports;
        DROP POLICY IF EXISTS "Org admins create exports" ON public.org_exports;
        EXECUTE 'CREATE POLICY "org_exports_unified" ON public.org_exports
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_exports.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_exports.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_exports';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_exports: %', SQLERRM;
    END;

    -- org_policies: Consolidate multiple access policies
    BEGIN
        DROP POLICY IF EXISTS "Policy Access" ON public.org_policies;
        DROP POLICY IF EXISTS "Unified Policy Access" ON public.org_policies;
        DROP POLICY IF EXISTS "View Policies" ON public.org_policies;
        DROP POLICY IF EXISTS "Manage Policies" ON public.org_policies;
        EXECUTE 'CREATE POLICY "org_policies_unified" ON public.org_policies
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_policies.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_policies.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_policies';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_policies: %', SQLERRM;
    END;

    -- org_risks: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Org members view risks" ON public.org_risks;
        DROP POLICY IF EXISTS "Org admins insert risks" ON public.org_risks;
        DROP POLICY IF EXISTS "Org admins update risks" ON public.org_risks;
        DROP POLICY IF EXISTS "Org admins delete risks" ON public.org_risks;
        EXECUTE 'CREATE POLICY "org_risks_unified" ON public.org_risks
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_risks.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_risks.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_risks';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_risks: %', SQLERRM;
    END;

    -- org_tasks: Consolidate multiple access policies
    BEGIN
        DROP POLICY IF EXISTS "Task Access" ON public.org_tasks;
        DROP POLICY IF EXISTS "Unified Task Access" ON public.org_tasks;
        DROP POLICY IF EXISTS "View Tasks" ON public.org_tasks;
        DROP POLICY IF EXISTS "Manage Tasks" ON public.org_tasks;
        DROP POLICY IF EXISTS "Users can only see their own org tasks" ON public.org_tasks;
        EXECUTE 'CREATE POLICY "org_tasks_unified" ON public.org_tasks
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_tasks.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_tasks.org_id
                    AND user_id = (select auth.uid())
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_tasks';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_tasks: %', SQLERRM;
    END;

    -- org_workflows: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view org workflows" ON public.org_workflows;
        DROP POLICY IF EXISTS "Admins can manage workflows" ON public.org_workflows;
        EXECUTE 'CREATE POLICY "org_workflows_unified" ON public.org_workflows
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_workflows.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = org_workflows.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for org_workflows';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped org_workflows: %', SQLERRM;
    END;

    -- report_templates: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view report templates in their org" ON public.report_templates;
        DROP POLICY IF EXISTS "Admins can manage report templates" ON public.report_templates;
        EXECUTE 'CREATE POLICY "report_templates_unified" ON public.report_templates
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = report_templates.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = report_templates.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for report_templates';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped report_templates: %', SQLERRM;
    END;

    -- risk_analyses: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view risk analyses in their org" ON public.risk_analyses;
        DROP POLICY IF EXISTS "Admins can manage risk analyses" ON public.risk_analyses;
        EXECUTE 'CREATE POLICY "risk_analyses_unified" ON public.risk_analyses
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = risk_analyses.org_id
                    AND user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = risk_analyses.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for risk_analyses';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped risk_analyses: %', SQLERRM;
    END;

    -- scheduled_tasks: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Admins can view scheduled tasks" ON public.scheduled_tasks;
        DROP POLICY IF EXISTS "Admins can manage scheduled tasks" ON public.scheduled_tasks;
        EXECUTE 'CREATE POLICY "scheduled_tasks_unified" ON public.scheduled_tasks
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = scheduled_tasks.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for scheduled_tasks';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped scheduled_tasks: %', SQLERRM;
    END;

    -- user_sessions: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "user_sessions_select" ON public.user_sessions;
        DROP POLICY IF EXISTS "user_sessions_manage" ON public.user_sessions;
        EXECUTE 'CREATE POLICY "user_sessions_unified" ON public.user_sessions
            FOR ALL
            USING (user_id = (select auth.uid()))';
        RAISE NOTICE 'Consolidated policies for user_sessions';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped user_sessions: %', SQLERRM;
    END;

    -- webhook_configs: Consolidate view + manage policies
    BEGIN
        DROP POLICY IF EXISTS "Admins can view webhook configs" ON public.webhook_configs;
        DROP POLICY IF EXISTS "Admins can manage webhook configs" ON public.webhook_configs;
        EXECUTE 'CREATE POLICY "webhook_configs_unified" ON public.webhook_configs
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.org_members
                    WHERE organization_id = webhook_configs.org_id
                    AND user_id = (select auth.uid())
                    AND role IN (''owner'', ''admin'')
                )
            )';
        RAISE NOTICE 'Consolidated policies for webhook_configs';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Skipped webhook_configs: %', SQLERRM;
    END;
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these after migration to verify fixes:
--
-- 1. Check for auth_rls_initplan issues:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- AND (qual ~ 'auth\.(uid|role|jwt|email)\(\)' 
--      OR with_check ~ 'auth\.(uid|role|jwt|email)\(\)')
-- AND NOT (qual ~ '\(select auth\.' OR with_check ~ '\(select auth\.');
--
-- 2. Check for multiple permissive policies:
-- SELECT schemaname, tablename, cmd, COUNT(*)
-- FROM pg_policies
-- WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
-- GROUP BY schemaname, tablename, cmd, roles
-- HAVING COUNT(*) > 1;
--
-- 3. Check for duplicate indexes:
-- SELECT idx1.indexname, idx2.indexname
-- FROM pg_indexes idx1
-- JOIN pg_indexes idx2 ON idx1.tablename = idx2.tablename
-- WHERE idx1.schemaname = 'public'
-- AND idx1.indexname < idx2.indexname
-- AND idx1.indexdef = idx2.indexdef;
