-- Care plan goals: backfill JSONB goals into org_care_goals.
--
-- Background:
--   org_care_plans.goals is a JSONB array (from 20260208_care_operations_modules.sql:164).
--   The in-app actions in app/app/actions/care-operations.ts (createGoal /
--   updateGoal / deleteGoal) read and write that JSONB column. Meanwhile
--   org_care_goals (a properly-modeled relational child table from
--   20260402_care_goals.sql) exists and is written to by the v1 API at
--   app/api/v1/care-plans/[id]/goals/route.ts. The two surfaces are split.
--
--   Audit P2 finding (#19 / §10 Care Plan Lifecycle): JSONB goals weaken
--   reporting, audit, and per-item permissions.
--
-- This migration is the FIRST phase of the JSONB → relational migration.
-- It does NOT touch the in-app actions or the JSONB column. It only:
--
--   1. Inserts a row into org_care_goals for every JSONB goal in
--      org_care_plans where the corresponding plan has zero rows in
--      org_care_goals yet. (We treat "no relational rows for this plan"
--      as "not yet migrated" so re-running is safe.)
--
--   2. Maps the JSONB shape onto the relational columns:
--        title              -> goal_text
--        description        -> measurement_method (closest semantic match)
--        target_date        -> target_date
--        progress_percentage -> progress_percentage (clamped 0-100)
--        status             -> status (mapped: pending → not_started,
--                                      achieved → achieved, else not_started)
--      created_at on the JSONB carries over; created_by is left null
--      because the JSONB doesn't track it.
--
-- Phase 2 (separate effort, see plan doc):
--   - Update care-operations actions to dual-write or single-write to
--     org_care_goals.
--   - Update app/app/care-plans/[id]/page.tsx to read from org_care_goals.
--   - Drop org_care_plans.goals JSONB column once all reads are migrated.
--
-- Idempotent and safe to re-run.

BEGIN;

DO $$
DECLARE
  inserted_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_care_plans' AND c.relkind = 'r'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'org_care_goals' AND c.relkind = 'r'
  ) THEN
    RAISE NOTICE 'org_care_plans or org_care_goals missing; skipping backfill';
    RETURN;
  END IF;

  WITH plans_to_migrate AS (
    SELECT
      cp.id AS plan_id,
      cp.organization_id AS plan_org_id,
      cp.client_id AS plan_client_id,
      cp.goals AS plan_goals
    FROM public.org_care_plans cp
    WHERE cp.goals IS NOT NULL
      AND jsonb_typeof(cp.goals) = 'array'
      AND jsonb_array_length(cp.goals) > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.org_care_goals g
        WHERE g.care_plan_id = cp.id
      )
  ),
  expanded AS (
    SELECT
      ptm.plan_id,
      ptm.plan_org_id,
      ptm.plan_client_id,
      goal.value AS goal_json
    FROM plans_to_migrate ptm,
         jsonb_array_elements(ptm.plan_goals) AS goal
    WHERE jsonb_typeof(goal.value) = 'object'
  ),
  inserted AS (
    INSERT INTO public.org_care_goals (
      org_id,
      care_plan_id,
      participant_id,
      goal_text,
      category,
      target_date,
      status,
      progress_percentage,
      measurement_method,
      created_at,
      updated_at
    )
    SELECT
      e.plan_org_id,
      e.plan_id,
      e.plan_client_id,
      COALESCE(
        NULLIF(TRIM(e.goal_json->>'title'), ''),
        '(untitled goal)'
      ),
      'independence',
      CASE
        WHEN e.goal_json->>'target_date' ~ '^\d{4}-\d{2}-\d{2}'
          THEN (e.goal_json->>'target_date')::date
        ELSE NULL
      END,
      CASE
        WHEN e.goal_json->>'status' = 'achieved' THEN 'achieved'
        WHEN e.goal_json->>'status' = 'in_progress' THEN 'in_progress'
        WHEN e.goal_json->>'status' = 'partially_achieved' THEN 'partially_achieved'
        WHEN e.goal_json->>'status' = 'discontinued' THEN 'discontinued'
        ELSE 'not_started'
      END,
      LEAST(
        100,
        GREATEST(
          0,
          COALESCE(
            NULLIF(e.goal_json->>'progress_percentage', '')::integer,
            0
          )
        )
      ),
      NULLIF(TRIM(e.goal_json->>'description'), ''),
      CASE
        WHEN e.goal_json->>'created_at' ~ '^\d{4}-\d{2}-\d{2}'
          THEN (e.goal_json->>'created_at')::timestamptz
        ELSE now()
      END,
      now()
    FROM expanded e
    RETURNING id
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  RAISE NOTICE 'org_care_goals backfill: inserted % rows from org_care_plans.goals JSONB', inserted_count;
END$$;

COMMIT;
