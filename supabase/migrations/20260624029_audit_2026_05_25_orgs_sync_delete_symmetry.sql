-- Audit 2026-05-25 (follow-up to 20260624025): close the DELETE side
-- of the orgs↔organizations mirror. The INSERT trigger from
-- 20260624025 keeps new rows in sync, but the v2 backfill drifted
-- again immediately because the MFA spec's cleanup deletes
-- `orgs` explicitly AFTER deleting `organizations`. When the
-- organizations.delete fails transiently (e.g. an in-flight
-- security_audit_log insert holds a brief FK ref), the cleanup
-- silently swallows the error (Supabase .delete() returns {error}
-- without throwing) but the explicit orgs.delete still proceeds and
-- removes the orgs row — leaving the organizations row stranded.
--
-- With the AFTER DELETE trigger below, the orgs row is removed by
-- the DB whenever the organizations row is removed, so the explicit
-- orgs.delete in test cleanup becomes a no-op and the symmetry
-- holds. The trigger is fail-safe: if the orgs row doesn't exist
-- (already deleted), the DELETE matches zero rows and is a no-op.
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

CREATE OR REPLACE FUNCTION public.mirror_organizations_delete_to_orgs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.orgs WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_organizations_delete_to_orgs ON public.organizations;
CREATE TRIGGER trg_mirror_organizations_delete_to_orgs
  AFTER DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.mirror_organizations_delete_to_orgs();

COMMENT ON FUNCTION public.mirror_organizations_delete_to_orgs() IS
  'Audit 2026-05-25 follow-up: close the DELETE side of the orgs↔organizations mirror so symmetry holds when callers delete only organizations.';

-- Backfill the rows that drifted between the trigger install and
-- this follow-up (~10 new rows from MFA + e2e fixtures). ON CONFLICT
-- DO NOTHING — additive only.
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
