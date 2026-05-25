-- Audit 2026-05-25 / Part A: forward protection for orgs↔organizations sync.
--
-- After every INSERT on `organizations`, mirror the row into `orgs` so the
-- 7 legacy tables that still FK to `orgs(id)` (memberships, org_files,
-- org_industries, org_memberships, org_module_entitlements,
-- org_notifications, org_subscriptions) never see a parent-row gap. The
-- application-level mirror at lib/supabase/mirror-legacy-orgs.ts already
-- exists, but it's only called from 4 paths; e2e seed paths and migration
-- bulk-inserts bypass it and accumulated 198 drift rows since the
-- 2026-05-23 consolidation.
--
-- Trigger is INSERT-only by design: name-update mirroring isn't needed
-- (no app code reads orgs.name), and DELETE symmetry is deferred. Mirror
-- runs as SECURITY DEFINER because callers may be RLS-restricted; the
-- target table `orgs` is service-role-only at the app layer anyway.
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

CREATE OR REPLACE FUNCTION public.mirror_organizations_to_orgs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.orgs (id, name, created_by, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.name, ''), 'Organization'),
    NEW.created_by,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_organizations_to_orgs ON public.organizations;
CREATE TRIGGER trg_mirror_organizations_to_orgs
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.mirror_organizations_to_orgs();

COMMENT ON FUNCTION public.mirror_organizations_to_orgs() IS
  'Audit 2026-05-25: keep legacy `orgs` mirror in lockstep with `organizations` so the 7 legacy-FK tables can never see a parent-row gap.';
