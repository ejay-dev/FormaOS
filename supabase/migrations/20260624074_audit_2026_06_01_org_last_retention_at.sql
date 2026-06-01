-- Audit M8: data-retention cron round-robin cursor.
--
-- The nightly /api/cron/data-retention sweep bounds itself to 250 orgs per
-- run. Previously it ordered by `id` ascending, so it processed the SAME
-- first 250 orgs every night and never reached orgs ranked 251+. This adds
-- a `last_retention_at` cursor the cron orders by (NULLS FIRST), and which
-- `executeRetention` stamps when it finishes — guaranteeing every org is
-- swept over successive runs.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS last_retention_at timestamptz;

-- Partial-friendly ordering index: NULLs (never swept) sort first, then the
-- least-recently swept. Matches the cron's
-- `order by last_retention_at asc nulls first, id asc`.
CREATE INDEX IF NOT EXISTS organizations_last_retention_at_idx
  ON public.organizations (last_retention_at ASC NULLS FIRST, id ASC)
  WHERE is_active = true;

COMMENT ON COLUMN public.organizations.last_retention_at IS
  'Last time the data-retention cron completed a sweep for this org. Used as a round-robin cursor so the per-run org cap cannot starve later orgs (audit M8, 2026-06-01).';
