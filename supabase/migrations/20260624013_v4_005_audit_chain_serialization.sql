-- v4-005 follow-up: serialize audit_log hash chain via UNIQUE(org_id, sequence_number).
--
-- The TypeScript writer reads the last (sequence_number, entry_hash) then
-- inserts (seq+1, prev_hash). Concurrent calls observe the same `last`
-- snapshot and both compute the same next seq + prev_hash — the chain
-- forks silently and tamper detection collapses.
--
-- A UNIQUE constraint forces the second writer's INSERT to fail with
-- 23505. The application retries with a fresh read, which now observes
-- the first writer's row and chains onto it. Net effect: per-org
-- serialization with no advisory lock and no DB-side hash duplication.
--
-- Step 1: backfill any null sequence_numbers using created_at ordering
-- per org. Existing rows with null sequence_number can't satisfy the
-- NOT NULL we want to add next, and a row_number()-based backfill keeps
-- the chain dense even though the hashes for those legacy rows aren't
-- recomputed (they were already broken — null seq + null prev_hash).
WITH numbered AS (
  SELECT id,
         row_number() OVER (PARTITION BY org_id ORDER BY created_at, id) AS rn
  FROM audit_log
  WHERE sequence_number IS NULL
)
UPDATE audit_log a
SET sequence_number = n.rn
FROM numbered n
WHERE a.id = n.id;

-- Step 2: enforce NOT NULL so every future write is chain-eligible.
ALTER TABLE audit_log
  ALTER COLUMN sequence_number SET NOT NULL;

-- Step 3: the constraint that gives us serialization. Drop-and-add so a
-- partial re-run is idempotent.
ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_org_seq_unique;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_org_seq_unique UNIQUE (org_id, sequence_number);
