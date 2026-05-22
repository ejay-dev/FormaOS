-- Migration: Backstop unique indexes for the highest double-submit risk paths.
-- Each block is guarded by a table-existence check so the migration is safe to
-- apply against environments that haven't yet received the upstream CREATE
-- TABLE migrations (avoids the "relation does not exist" failure mode the
-- SCIM RLS migration hit).
--
-- These indexes are the second layer of defence — frontend buttons should
-- still disable on submit. The unique index is what catches a double-click
-- when the click made it through before the disable did.

-- ---------------------------------------------------------------------------
-- 1. team_invitations: prevent two pending invitations for the same email
--    in the same org. Closes the select-revoke-insert race in
--    lib/invitations/create-invitation.ts.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_invitations'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_org_email_pending_uniq
        ON public.team_invitations (organization_id, lower(email))
        WHERE status = 'pending'
    $idx$;
  ELSE
    RAISE NOTICE 'team_invitations not present — skipping pending-email unique index';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. org_evidence: prevent duplicate registration of the same storage path.
--    Storage object names are random UUIDs so collisions are real only if
--    the modal retries the action server-side without a fresh upload — the
--    constraint catches that case before a duplicate metadata row lands.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_evidence'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS org_evidence_org_path_uniq
        ON public.org_evidence (organization_id, file_path)
    $idx$;
  ELSE
    RAISE NOTICE 'org_evidence not present — skipping path unique index';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. org_ndis_line_items: prevent regenerating a claim for the same visit
--    twice. The route already filters by existing visit_ids, but two
--    concurrent triggers can both pass the filter and both insert. Index
--    is partial so legacy rows with NULL visit_id (manually-entered claims)
--    are not constrained.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_ndis_line_items'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS org_ndis_line_items_visit_uniq
        ON public.org_ndis_line_items (org_id, visit_id)
        WHERE visit_id IS NOT NULL
    $idx$;
  ELSE
    RAISE NOTICE 'org_ndis_line_items not present — skipping visit unique index';
  END IF;
END $$;
