-- Policy lifecycle: repair broken RLS + add lifecycle invariants.
--
-- Background:
--   20260403_policy_lifecycle.sql created policy_versions, policy_approvals,
--   policy_acknowledgments, and policy_review_schedules with RLS predicates
--   of the form
--
--       USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
--
--   `org_members.org_id` does not exist — the canonical column is
--   `organization_id`. The policy SELECT either errors at evaluation time
--   or returns no rows, so the lifecycle tables have been effectively
--   unreadable since they shipped. This migration drops and recreates the
--   policies with the correct column reference, plus adds the (policy_id,
--   version_number) uniqueness constraint that the lifecycle code relies
--   on for monotonic version numbering.
--
--   Phase 1 of the lifecycle wiring (audit P1 deferred item — policy
--   approval lifecycle).
--
-- Idempotent. Each block is guarded by IF EXISTS on the table.

BEGIN;

-- ---- policy_versions ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'policy_versions' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "policy_versions_org" ON public.policy_versions';
    EXECUTE $POLICY$
      CREATE POLICY policy_versions_org
        ON public.policy_versions
        FOR ALL
        TO authenticated
        USING (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
    $POLICY$;

    -- Monotonic version numbering per policy.
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'policy_versions_policy_version_unique'
        AND conrelid = 'public.policy_versions'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.policy_versions '
           || 'ADD CONSTRAINT policy_versions_policy_version_unique '
           || 'UNIQUE (policy_id, version_number)';
    END IF;

    -- Helpful index for "latest version per policy" lookups.
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_version '
         || 'ON public.policy_versions (policy_id, version_number DESC)';
  END IF;
END$$;

-- ---- policy_approvals ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'policy_approvals' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "policy_approvals_org" ON public.policy_approvals';
    EXECUTE $POLICY$
      CREATE POLICY policy_approvals_org
        ON public.policy_approvals
        FOR ALL
        TO authenticated
        USING (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
    $POLICY$;
  END IF;
END$$;

-- ---- policy_acknowledgments ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'policy_acknowledgments' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "policy_acks_org" ON public.policy_acknowledgments';
    EXECUTE $POLICY$
      CREATE POLICY policy_acks_org
        ON public.policy_acknowledgments
        FOR ALL
        TO authenticated
        USING (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
    $POLICY$;
  END IF;
END$$;

-- ---- policy_review_schedules ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'policy_review_schedules' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "policy_review_org" ON public.policy_review_schedules';
    EXECUTE $POLICY$
      CREATE POLICY policy_review_org
        ON public.policy_review_schedules
        FOR ALL
        TO authenticated
        USING (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          org_id IN (
            SELECT organization_id
            FROM public.org_members
            WHERE user_id = auth.uid()
          )
        )
    $POLICY$;
  END IF;
END$$;

COMMIT;
