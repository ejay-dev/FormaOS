-- Audit 2026-05-24 — add missing RLS policies for 6 tenant-scoped tables
-- that had RLS *enabled* in production but ZERO policies attached. When RLS
-- is on but no policy exists, every non-service-role query returns zero
-- rows; the app was only working because server-side code uses the service
-- role and bypasses RLS. Any client-side or service-token-via-PostgREST
-- access would silently fail closed.
--
-- Live diagnosis (2026-05-24):
--   table                | rowsecurity | policy_count
--   integration_events   |    true     |     0
--   memberships          |    true     |     0    (legacy table, 0 rows — `org_members` is the active membership table with 2,213 rows)
--   policies             |    true     |     0    (the compliance policy registry)
--   registers            |    true     |     0
--   report_generations   |    true     |     0
--   tasks                |    true     |     0
--
-- Pattern follows existing tenant-scoped policies (see compliance_scans,
-- file_metadata): `organization_id IN (SELECT organization_id FROM
-- org_members WHERE user_id = auth.uid())`. The SELECT policy wraps
-- `auth.uid()` in a subselect to let Postgres cache the call once per
-- query (project convention).
--
-- The `memberships` table is the only outlier: it's an empty legacy table
-- with no consumer code; we add a strict, owner-only SELECT policy + an
-- explicit comment that the table is deprecated rather than synthesise
-- false multi-tenant semantics for a table no one writes to.
--
-- Idempotent: CREATE POLICY IF NOT EXISTS isn't supported, so each block
-- is wrapped in a DO block that no-ops if the policy already exists.

-- ---------------------------------------------------------------------------
-- integration_events
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='integration_events'
      AND policyname='Users can view integration events in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can view integration events in their org"
      ON public.integration_events
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM org_members
          WHERE user_id = (SELECT auth.uid() AS uid)
        )
      );
    $POLICY$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='integration_events'
      AND policyname='Admins can manage integration events'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Admins can manage integration events"
      ON public.integration_events
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
            AND role = ANY (ARRAY['owner','admin','manager'])
        )
      );
    $POLICY$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- policies  (compliance-policy registry table)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='policies'
      AND policyname='Users can view policies in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can view policies in their org"
      ON public.policies
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = (SELECT auth.uid() AS uid)
        )
      );
    $POLICY$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='policies'
      AND policyname='Admins can manage policies'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Admins can manage policies"
      ON public.policies
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
            AND role = ANY (ARRAY['owner','admin','manager'])
        )
      );
    $POLICY$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- registers
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='registers'
      AND policyname='Users can view registers in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can view registers in their org"
      ON public.registers
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = (SELECT auth.uid() AS uid)
        )
      );
    $POLICY$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='registers'
      AND policyname='Admins can manage registers'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Admins can manage registers"
      ON public.registers
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
            AND role = ANY (ARRAY['owner','admin','manager'])
        )
      );
    $POLICY$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- report_generations
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='report_generations'
      AND policyname='Users can view report generations in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can view report generations in their org"
      ON public.report_generations
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = (SELECT auth.uid() AS uid)
        )
      );
    $POLICY$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='report_generations'
      AND policyname='Members can create report generations in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Members can create report generations in their org"
      ON public.report_generations
      FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
        )
      );
    $POLICY$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Users can view tasks in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can view tasks in their org"
      ON public.tasks
      FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = (SELECT auth.uid() AS uid)
        )
      );
    $POLICY$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Members can manage tasks in their org'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Members can manage tasks in their org"
      ON public.tasks
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid()
        )
      );
    $POLICY$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- memberships  (legacy / empty — `org_members` is the active table)
--
-- This table has 0 rows in production and `org_members` (2,213 rows) is
-- the active membership table referenced by every other policy in this
-- migration. We add a strict owner-scoped SELECT policy so the table is
-- safe under RLS, and document the deprecation in a column-level comment.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='memberships'
      AND policyname='Users can read their own membership rows'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "Users can read their own membership rows"
      ON public.memberships
      FOR SELECT
      USING (user_id = (SELECT auth.uid() AS uid));
    $POLICY$;
  END IF;
END $$;

COMMENT ON TABLE public.memberships IS
  'Deprecated 2026-05-24 — empty legacy table. Active membership data lives in public.org_members. Kept with strict RLS so the row never breaks future schema audits, but no application code reads or writes this table.';
