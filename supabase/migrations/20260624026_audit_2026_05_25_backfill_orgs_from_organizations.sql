-- Audit 2026-05-25 / Part B: backfill the 198 `organizations` rows that
-- accumulated without their `orgs` mirror between the 2026-05-23
-- consolidation and the 2026-05-25 trigger install. ~97% are e2e test
-- fixtures and orphan signups; backfilling rather than deleting keeps
-- this migration 100% additive — no production rows are destroyed.
--
-- INSERT … ON CONFLICT (id) DO NOTHING makes this idempotent and safe
-- against the now-installed AFTER INSERT trigger (the trigger and this
-- backfill are non-conflicting INSERT-with-skip operations on the same
-- table).

INSERT INTO public.orgs (id, name, created_by, created_at, updated_at)
SELECT
  org.id,
  COALESCE(NULLIF(org.name, ''), 'Organization'),
  org.created_by,
  org.created_at,
  now()
FROM public.organizations org
WHERE NOT EXISTS (SELECT 1 FROM public.orgs o WHERE o.id = org.id)
ON CONFLICT (id) DO NOTHING;
