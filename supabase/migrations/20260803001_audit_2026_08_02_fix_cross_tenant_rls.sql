-- Audit 2026-08-02 — close the live cross-tenant RLS failures.
--
-- Three independent defects, all of which produce an always-true security
-- predicate and therefore pass any check that only asserts a policy exists:
--
--   1. org_members: `SELECT organization_id FROM current_user_org_ids()`.
--      current_user_org_ids() RETURNS SETOF uuid, so its only output column is
--      named after the function. The unqualified `organization_id` therefore
--      does NOT resolve against that FROM item — it falls through to the OUTER
--      query scope, i.e. org_members.organization_id. The predicate degenerates
--      to `organization_id IN (organization_id, ...)`, true for every row
--      whenever the function returns >= 1 row. Verified live before this fix:
--      a user belonging to exactly one org read 2,410 rows across 2,309 orgs.
--
--      The rewrite below uses an explicit column alias — `AS t(allowed_org_id)`.
--      That name exists on no table in the predicate, so if the binding is ever
--      wrong again Postgres raises "column does not exist" instead of silently
--      returning true. Fail loudly, not open.
--
--   2. `m.organization_id = m.organization_id` in the WITH CHECK of the
--      "Unified * Access" family (org_assets, org_audit_logs, org_policies,
--      org_tasks) and org_notifications.notif_insert_member. The USING side of
--      these policies is correctly scoped, so reads look clean and only WRITES
--      cross tenants — which is why a read-only isolation sweep cleared them.
--
--   3. org_audit_logs.audit_logs_read_access checks the caller's ROLE without
--      correlating org_members.organization_id to the row's organization_id.
--      Permissive policies are OR-ed, so this silently widened the correct
--      audit_log_org_isolation policy beside it. Verified live: an admin of one
--      org read 58,586 rows across 3,385 orgs, while an OWNER of one org read
--      only 5 — the role list is admin/manager/compliance_officer, which is why
--      an owner-only probe reported the table as correctly isolated.
--
-- Scope note: this migration fixes tenant isolation ONLY. It deliberately does
-- not change any permission model (e.g. the "Unified" policies granting plain
-- members write access where a sibling policy intends admin-only). Those are
-- real but separate authorization questions and are tracked independently, so
-- that a security hotfix cannot regress a product behaviour.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. org_members — replace the four self-correlating predicates.
--    members_self_access (user_id = auth.uid()) is correct and is left alone.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS members_org_access ON public.org_members;
CREATE POLICY members_org_access ON public.org_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT t.allowed_org_id
      FROM public.current_user_org_ids() AS t(allowed_org_id)
    )
  );

DROP POLICY IF EXISTS members_admin_insert ON public.org_members;
CREATE POLICY members_admin_insert ON public.org_members
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT t.allowed_org_id
      FROM public.current_user_admin_org_ids() AS t(allowed_org_id)
    )
  );

-- The previous members_admin_update had a broken USING and NO WITH CHECK. With
-- no WITH CHECK, Postgres reuses USING for the post-image, so an admin could
-- also move a row INTO another org. Both sides are now stated explicitly.
DROP POLICY IF EXISTS members_admin_update ON public.org_members;
CREATE POLICY members_admin_update ON public.org_members
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT t.allowed_org_id
      FROM public.current_user_admin_org_ids() AS t(allowed_org_id)
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT t.allowed_org_id
      FROM public.current_user_admin_org_ids() AS t(allowed_org_id)
    )
  );

DROP POLICY IF EXISTS members_admin_delete ON public.org_members;
CREATE POLICY members_admin_delete ON public.org_members
  FOR DELETE
  USING (
    organization_id IN (
      SELECT t.allowed_org_id
      FROM public.current_user_admin_org_ids() AS t(allowed_org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 2. org_audit_logs
--
--    audit_logs_read_access is dropped rather than repaired: the correctly
--    scoped audit_log_org_isolation and "Admins and Owners can view audit logs"
--    policies beside it already cover every legitimate read, so repairing it
--    would only re-add a duplicate permissive policy.
--
--    Immutability is unaffected: org_audit_logs_no_update / _no_delete are
--    RESTRICTIVE (polpermissive = false) and continue to deny all UPDATE and
--    DELETE regardless of the permissive policies below.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS audit_logs_read_access ON public.org_audit_logs;

-- Was: WITH CHECK ((SELECT auth.uid()) IS NOT NULL) — any signed-in user could
-- forge an audit row attributed to any organisation.
DROP POLICY IF EXISTS audit_logs_write_access ON public.org_audit_logs;
CREATE POLICY audit_logs_write_access ON public.org_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_audit_logs.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Unified Log Access" ON public.org_audit_logs;
CREATE POLICY "Unified Log Access" ON public.org_audit_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_audit_logs.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_audit_logs.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- 3. The remaining "Unified * Access" tautological WITH CHECK clauses.
--    USING sides are already correct and are restated verbatim so the policy
--    is replaced atomically rather than altered in place.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Unified Asset Access" ON public.org_assets;
CREATE POLICY "Unified Asset Access" ON public.org_assets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_assets.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_assets.organization_id
    )
  );

DROP POLICY IF EXISTS "Unified Policy Access" ON public.org_policies;
CREATE POLICY "Unified Policy Access" ON public.org_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_policies.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_policies.organization_id
    )
  );

DROP POLICY IF EXISTS "Unified Task Access" ON public.org_tasks;
CREATE POLICY "Unified Task Access" ON public.org_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_tasks.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = (SELECT auth.uid())
        AND m.organization_id = org_tasks.organization_id
    )
  );

-- org_notifications uses org_id, NOT organization_id. Using the wrong column
-- name here would either error or silently re-open the hole.
DROP POLICY IF EXISTS notif_insert_member ON public.org_notifications;
CREATE POLICY notif_insert_member ON public.org_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = org_notifications.org_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. trust_packets — "Valid tokens are publicly readable" has no TO clause (so
--    it applies to anon) and no token predicate, because RLS cannot see the
--    token the caller supplied. Combined with GRANT ALL ... TO anon it publishes
--    the token column, which IS the share credential.
--
--    Dropped rather than rewritten: no code path reads this table through the
--    anon key. The only application access is one INSERT in
--    app/api/trust-packet/generate/route.ts; /api/trust-packet/verify performs
--    signature verification only and never queries the table. Share-link reads,
--    when built, must go through a server route that validates the token with
--    the service-role client.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Valid tokens are publicly readable" ON public.trust_packets;

-- ---------------------------------------------------------------------------
-- 5. team_invitations — team_invitations_view_own_by_email resolves the
--    caller's address with `SELECT email FROM auth.users WHERE id = auth.uid()`,
--    but the `authenticated` role has no SELECT on auth.users. A policy that
--    RAISES rather than returning false aborts the whole query, so every
--    client-side read of team_invitations failed with
--    "permission denied for table users" — found by probing the table as a real
--    user, not by reading the policy.
--
--    Dropped rather than rewritten: invitations_self_select already expresses
--    the identical intent correctly, using (auth.jwt() ->> 'email').
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS team_invitations_view_own_by_email ON public.team_invitations;

COMMIT;
