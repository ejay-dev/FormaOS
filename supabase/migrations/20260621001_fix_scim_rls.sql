-- Migration: Fix SCIM table RLS policies
-- The original scim_provisioning migration created policies with FOR ALL USING (true)
-- without restricting to service_role, allowing any authenticated user to read/write
-- any organization's SCIM tokens and groups (cross-tenant data leak + privilege escalation).
--
-- This migration is guarded so it skips cleanly on databases that have not yet
-- received the 20260311_scim_provisioning.sql migration (e.g. dev branches or
-- target DBs whose history has drifted from the committed migration set).
-- Re-running once the SCIM tables exist will apply the hardened policies.

-- ============================================================================
-- scim_tokens: Bearer tokens used for admin-level SCIM API access
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scim_tokens'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_tokens_service ON public.scim_tokens';
    EXECUTE 'DROP POLICY IF EXISTS scim_tokens_admin_select ON public.scim_tokens';
    EXECUTE 'DROP POLICY IF EXISTS scim_tokens_block_anon ON public.scim_tokens';

    -- Service role only (SCIM provisioning always uses admin client, never user sessions)
    EXECUTE $policy$
      CREATE POLICY scim_tokens_service ON public.scim_tokens
        AS RESTRICTIVE
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;

    -- Org owners/admins can view (NOT write) their own org's SCIM token metadata.
    -- Token hashes must never be returned to clients — API layer handles projection.
    EXECUTE $policy$
      CREATE POLICY scim_tokens_admin_select ON public.scim_tokens
        FOR SELECT
        TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM public.org_members
            WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin')
          )
        )
    $policy$;

    -- Block anonymous users
    EXECUTE $policy$
      CREATE POLICY scim_tokens_block_anon ON public.scim_tokens
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false)
    $policy$;
  ELSE
    RAISE NOTICE 'scim_tokens table not present — skipping RLS hardening';
  END IF;
END $$;

-- ============================================================================
-- scim_groups: IdP-managed groups mapped to org roles
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scim_groups'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_groups_service ON public.scim_groups';
    EXECUTE 'DROP POLICY IF EXISTS scim_groups_member_select ON public.scim_groups';
    EXECUTE 'DROP POLICY IF EXISTS scim_groups_admin_all ON public.scim_groups';
    EXECUTE 'DROP POLICY IF EXISTS scim_groups_block_anon ON public.scim_groups';

    EXECUTE $policy$
      CREATE POLICY scim_groups_service ON public.scim_groups
        AS RESTRICTIVE
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;

    -- Org members can view their own org's SCIM groups
    EXECUTE $policy$
      CREATE POLICY scim_groups_member_select ON public.scim_groups
        FOR SELECT
        TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
    $policy$;

    -- Org owners/admins can manage SCIM groups
    EXECUTE $policy$
      CREATE POLICY scim_groups_admin_all ON public.scim_groups
        FOR ALL
        TO authenticated
        USING (
          organization_id IN (
            SELECT organization_id FROM public.org_members
            WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin')
          )
        )
        WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM public.org_members
            WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin')
          )
        )
    $policy$;

    -- Block anonymous users
    EXECUTE $policy$
      CREATE POLICY scim_groups_block_anon ON public.scim_groups
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false)
    $policy$;
  ELSE
    RAISE NOTICE 'scim_groups table not present — skipping RLS hardening';
  END IF;
END $$;

-- ============================================================================
-- scim_group_members: SCIM group membership (joins through scim_groups for org scope)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scim_group_members'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_group_members_service ON public.scim_group_members';
    EXECUTE 'DROP POLICY IF EXISTS scim_group_members_member_select ON public.scim_group_members';
    EXECUTE 'DROP POLICY IF EXISTS scim_group_members_admin_all ON public.scim_group_members';
    EXECUTE 'DROP POLICY IF EXISTS scim_group_members_block_anon ON public.scim_group_members';

    EXECUTE $policy$
      CREATE POLICY scim_group_members_service ON public.scim_group_members
        AS RESTRICTIVE
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $policy$;

    -- Org members can view group memberships within their own org
    EXECUTE $policy$
      CREATE POLICY scim_group_members_member_select ON public.scim_group_members
        FOR SELECT
        TO authenticated
        USING (
          group_id IN (
            SELECT sg.id FROM public.scim_groups sg
            JOIN public.org_members om ON om.organization_id = sg.organization_id
            WHERE om.user_id = auth.uid()
          )
        )
    $policy$;

    -- Org owners/admins can manage group memberships within their own org
    EXECUTE $policy$
      CREATE POLICY scim_group_members_admin_all ON public.scim_group_members
        FOR ALL
        TO authenticated
        USING (
          group_id IN (
            SELECT sg.id FROM public.scim_groups sg
            JOIN public.org_members om ON om.organization_id = sg.organization_id
            WHERE om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
          )
        )
        WITH CHECK (
          group_id IN (
            SELECT sg.id FROM public.scim_groups sg
            JOIN public.org_members om ON om.organization_id = sg.organization_id
            WHERE om.user_id = auth.uid()
              AND om.role IN ('owner', 'admin')
          )
        )
    $policy$;

    -- Block anonymous users
    EXECUTE $policy$
      CREATE POLICY scim_group_members_block_anon ON public.scim_group_members
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false)
    $policy$;
  ELSE
    RAISE NOTICE 'scim_group_members table not present — skipping RLS hardening';
  END IF;
END $$;
