-- Audit 2026-05-27 — R2 (Phase B): repoint FKs to organizations(id),
-- drop the orgs ↔ organizations mirror triggers, drop public.orgs.
--
-- Background: every business path writes to public.organizations, but
-- 4 dependent tables (memberships, org_memberships, org_notifications,
-- org_subscriptions) still FK to public.orgs(id) — a legacy table kept
-- alive by two PL/pgSQL mirror triggers
-- (trg_mirror_organizations_to_orgs INSERT/UPDATE,
-- trg_mirror_organizations_delete_to_orgs DELETE). The mirror works,
-- but the trigger gap is a live silent-failure surface: a transient
-- error in the mirror leaves the two tables out of sync and the
-- dependents either FK-fail or point at a stale row. The 2026-05-23
-- consolidation cleaned up 395 orphaned rows from exactly that drift.
--
-- This migration eliminates the gap by:
--   1. Re-verifying perfect overlap (orgs ⊆ organizations and the
--      4 dependents have no orphan org_ids).
--   2. Re-pointing each of the 4 FKs to organizations(id) ON DELETE
--      CASCADE — the constraint name is preserved where possible so
--      backups / DR tooling still resolves them.
--   3. Dropping both mirror triggers + their backing function.
--   4. Dropping public.orgs.
--
-- All of (2)–(4) runs inside the implicit transaction Supabase wraps
-- migrations with. If any step fails the entire migration rolls back,
-- so partial drift (e.g., 2 of 4 FKs repointed) is not possible.

DO $$
DECLARE
  null_count bigint;
BEGIN
  -- (1) Re-verify integrity inside the migration too — the dry-run is
  -- a defence-in-depth, this is the load-bearing check. Anything that
  -- changed between the dry-run and the apply ABORTs cleanly.
  SELECT count(*) INTO null_count FROM (
    SELECT 1 FROM public.memberships m
      WHERE m.org_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = m.org_id)
    UNION ALL
    SELECT 1 FROM public.org_memberships om
      WHERE om.org_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = om.org_id)
    UNION ALL
    SELECT 1 FROM public.org_notifications n
      WHERE n.org_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = n.org_id)
    UNION ALL
    SELECT 1 FROM public.org_subscriptions s
      WHERE s.org_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = s.org_id)
    UNION ALL
    SELECT 1 FROM public.orgs g
      WHERE NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = g.id)
  ) AS orphans;

  IF null_count > 0 THEN
    RAISE EXCEPTION
      'R2 (Phase B) aborted: % orphan row(s) detected vs organizations. Reconcile orgs ↔ organizations first.',
      null_count;
  END IF;
END $$;

-- (2) Repoint FKs. Drop the old constraint and create the new one
-- under the same name so external tooling (ER diagrams, backup
-- inspection scripts) keeps resolving them.

ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_org_fk,
  ADD CONSTRAINT memberships_org_fk
    FOREIGN KEY (org_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;

ALTER TABLE public.org_memberships
  DROP CONSTRAINT IF EXISTS org_memberships_org_id_fkey,
  ADD CONSTRAINT org_memberships_org_id_fkey
    FOREIGN KEY (org_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;

ALTER TABLE public.org_notifications
  DROP CONSTRAINT IF EXISTS org_notifications_org_id_fkey,
  ADD CONSTRAINT org_notifications_org_id_fkey
    FOREIGN KEY (org_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;

ALTER TABLE public.org_subscriptions
  DROP CONSTRAINT IF EXISTS org_subscriptions_org_id_fkey,
  ADD CONSTRAINT org_subscriptions_org_id_fkey
    FOREIGN KEY (org_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE;

-- (3) Drop the mirror triggers + their backing function. Once dropped,
-- writes to organizations no longer fan out to orgs — and since the
-- 4 dependents no longer point at orgs, that's exactly correct.

DROP TRIGGER IF EXISTS trg_mirror_organizations_to_orgs        ON public.organizations;
DROP TRIGGER IF EXISTS trg_mirror_organizations_delete_to_orgs ON public.organizations;
DROP FUNCTION IF EXISTS public.mirror_organizations_to_orgs();
DROP FUNCTION IF EXISTS public.mirror_organizations_delete_to_orgs();

-- (4) Drop public.orgs. RESTRICT (default) — if any object we missed
-- still depends on it, the migration aborts cleanly instead of
-- silently cascading.
DROP TABLE IF EXISTS public.orgs;

-- Post-condition: orgs is gone, the 4 FKs now reference organizations.
DO $$
DECLARE
  remaining_fk_to_orgs int;
  orgs_still_present  boolean;
BEGIN
  SELECT count(*) INTO remaining_fk_to_orgs
    FROM pg_constraint c
    JOIN pg_class p ON p.oid = c.confrelid
    WHERE c.contype = 'f'
      AND p.relname = 'orgs'
      AND p.relnamespace = 'public'::regnamespace;
  IF remaining_fk_to_orgs > 0 THEN
    RAISE EXCEPTION
      'R2 (Phase B) post-condition failed: % FK(s) still reference public.orgs',
      remaining_fk_to_orgs;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema='public' AND table_name='orgs'
  ) INTO orgs_still_present;
  IF orgs_still_present THEN
    RAISE EXCEPTION
      'R2 (Phase B) post-condition failed: public.orgs is still present';
  END IF;

  RAISE NOTICE 'R2 (Phase B) complete — orgs dropped, 4 FKs repointed to organizations, mirror triggers removed.';
END $$;
