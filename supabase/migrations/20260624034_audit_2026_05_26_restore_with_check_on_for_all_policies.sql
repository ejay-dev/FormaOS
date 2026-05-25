-- Audit 2026-05-26 — restore WITH CHECK on FOR ALL policies that
-- lost it in migration 20260214000.
--
-- Background: 20260214000 wrapped auth.* calls in (select auth.*())
-- for initplan performance. The DO-block re-emitter read
-- pg_policies.with_check and only re-applied it when non-NULL.
-- Postgres stores `with_check = NULL` for FOR ALL policies defined
-- as `FOR ALL USING (x)` without explicit WITH CHECK — but at query
-- time Postgres uses the USING clause as an implicit WITH CHECK.
-- Re-emitting WITHOUT WITH CHECK therefore drops that implicit
-- write check: UPDATEs that satisfy USING can now write rows that
-- violate the tenant filter (e.g. set `org_id` to another tenant).
--
-- Migration 20260617_fix_care_plans_rls_update.sql documents this
-- exact root cause and fixed one table (org_care_plans). Every
-- other FOR ALL policy in the affected set is still vulnerable —
-- estimated 30-60 policies.
--
-- Strategy: enumerate FOR ALL policies whose with_check is NULL,
-- drop and recreate them with WITH CHECK = USING. Idempotent: if
-- run twice the second pass is a no-op (with_check is now set).

DO $$
DECLARE
  rec record;
  restored_count integer := 0;
  policy_def text;
  using_clause text;
BEGIN
  FOR rec IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      qual::text AS using_text
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'ALL'
      AND with_check IS NULL
      AND qual IS NOT NULL
  LOOP
    using_clause := rec.using_text;

    -- DROP and recreate with explicit WITH CHECK = USING.
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      rec.policyname,
      rec.schemaname,
      rec.tablename
    );

    policy_def := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR ALL TO %s USING (%s) WITH CHECK (%s)',
      rec.policyname,
      rec.schemaname,
      rec.tablename,
      rec.permissive,
      array_to_string(rec.roles, ', '),
      using_clause,
      using_clause
    );

    BEGIN
      EXECUTE policy_def;
      restored_count := restored_count + 1;
      RAISE NOTICE '[with-check-restore] %.%.%', rec.schemaname, rec.tablename, rec.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[with-check-restore] FAILED %.%.%: %',
        rec.schemaname, rec.tablename, rec.policyname, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '[with-check-restore] restored WITH CHECK on % policies', restored_count;
END $$;

-- Post-condition: no FOR ALL policy in the public schema has a
-- non-NULL USING clause and a NULL WITH CHECK clause.
DO $$
DECLARE
  remaining integer;
  example text;
BEGIN
  SELECT COUNT(*), MIN(policyname)
    INTO remaining, example
    FROM pg_policies
   WHERE schemaname = 'public'
     AND cmd = 'ALL'
     AND qual IS NOT NULL
     AND with_check IS NULL;

  IF remaining > 0 THEN
    RAISE EXCEPTION
      '[with-check-restore] % FOR ALL policies still missing WITH CHECK (e.g. %)',
      remaining, example;
  END IF;
END $$;
