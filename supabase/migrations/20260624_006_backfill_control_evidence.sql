-- Backfill control_evidence for existing org_evidence rows.
-- Audit compliance-003 (P0, 2026-05-22): control_evidence had 0 rows
-- in prod despite 354 org_evidence rows, because uploadEvidence only
-- wrote task_id and never inserted the join row.
--
-- Forward-fix landed in app/app/actions/evidence.ts. This migration
-- closes the historical gap by INSERTing one control_evidence row per
-- (org_evidence.id, control_tasks.control_id) pair derivable through
-- the existing task_id → control_tasks join.
--
-- Pre-apply count (verified via MCP, 2026-05-22):
--   evidence_rows               = 354
--   evidence_with_task_id       = 332
--   control_evidence_rows_now   = 0
--   backfill_candidate_pairs    = 74
--
-- (Only 74 of 332 task-tagged evidence rows have a task that resolves to
-- a control via control_tasks. The other 258 have task_ids that aren't
-- linked to any control — those will not be backfilled and remain
-- "orphan" evidence until the upload UI / re-classification flow links
-- them explicitly.)

BEGIN;

INSERT INTO public.control_evidence (
  organization_id,
  control_id,
  evidence_id,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT
  e.organization_id,
  ct.control_id,
  e.id AS evidence_id,
  -- Map existing org_evidence verification_status to control_evidence.status.
  -- 'approved' / 'verified' → 'approved'; everything else → 'pending'.
  CASE
    WHEN e.verification_status IN ('approved','verified') THEN 'approved'
    ELSE 'pending'
  END AS status,
  e.created_at,
  now()
FROM public.org_evidence e
JOIN public.control_tasks ct
  ON ct.task_id = e.task_id
 AND ct.organization_id = e.organization_id
WHERE e.task_id IS NOT NULL
ON CONFLICT (organization_id, control_id, evidence_id) DO NOTHING;

COMMIT;
