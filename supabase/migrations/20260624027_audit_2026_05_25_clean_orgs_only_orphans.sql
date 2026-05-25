-- Audit 2026-05-25 / Part C: delete the 4 `orgs` rows that have no
-- matching `organizations` parent. All 4 are test fixtures with zero FK
-- refs across the 7 legacy tables (verified 2026-05-25 09:10 UTC).
--
-- Archive table is created first to close the disposition gap flagged in
-- 20260624009's v4-031 note — that prior consolidation deleted 1077 orgs
-- rows with no archive step, which would have been recoverable for ~24h
-- via Supabase point-in-time recovery but not after that. This snapshot
-- buys an open-ended recovery window from inside the database itself.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS; DELETE with NOT EXISTS is a
-- no-op on a clean state.

CREATE TABLE IF NOT EXISTS public.__pre_orgs_sync_2026_05_25_orgs_only AS
SELECT * FROM public.orgs o
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = o.id);

DELETE FROM public.orgs
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = orgs.id);

COMMENT ON TABLE public.__pre_orgs_sync_2026_05_25_orgs_only IS
  'Snapshot of `orgs` rows that had no matching `organizations` parent at the moment of 20260624027 cleanup. Safe to drop after a recovery window has elapsed.';
