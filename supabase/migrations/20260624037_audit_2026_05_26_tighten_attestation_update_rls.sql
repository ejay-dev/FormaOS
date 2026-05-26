-- Audit 2026-05-26 — tighten the org_control_attestations UPDATE
-- policy.
--
-- STATUS: SKIPPED on 2026-05-26 deploy. The `org_control_attestations`
-- table does not exist in the current production environment (verified
-- via information_schema.tables lookup pre-apply). The compliance-
-- attestations surface was likely scoped down or renamed between when
-- this migration was drafted and when it was applied. Re-evaluate
-- whether this migration is still relevant before the next attestation
-- workstream — if the table is reintroduced under a different name,
-- this migration should be rewritten to target it.
--
-- Background (Compliance M16): the existing
-- `org_control_attestations_org_update` policy only verifies that the
-- caller is a member of the org. Inside a single org, any member can
-- UPDATE another member's pending attestation (notes,
-- rejected_reason, status). The application-layer guard in
-- lib/actions/compliance-attestations.ts catches same-user review via
-- a CHECK constraint, but a malicious org member using the Supabase
-- JS client directly (bypassing the server action) could still edit
-- a peer's claim.
--
-- Strategy: require the updater to be either (a) the claimer
-- editing their own pending row, or (b) a reviewer (owner / admin /
-- compliance_admin) and NOT the original claimer (preserves the
-- segregation-of-duties invariant the table's CHECK already
-- documents).

DROP POLICY IF EXISTS org_control_attestations_org_update
  ON public.org_control_attestations;

CREATE POLICY org_control_attestations_org_update
  ON public.org_control_attestations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = org_control_attestations.organization_id
         AND m.user_id = auth.uid()
         AND (
           -- Claimer can edit their own pending claim.
           (
             org_control_attestations.claimed_by = auth.uid()
             AND org_control_attestations.status IN ('pending', 'submitted')
           )
           -- Reviewer (owner/admin/compliance_admin) can review someone
           -- else's claim. Excludes the original claimer to preserve
           -- segregation of duties.
           OR (
             m.role IN ('owner', 'admin', 'compliance_admin')
             AND org_control_attestations.claimed_by IS DISTINCT FROM auth.uid()
           )
         )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = org_control_attestations.organization_id
         AND m.user_id = auth.uid()
         AND (
           (
             org_control_attestations.claimed_by = auth.uid()
             AND org_control_attestations.status IN ('pending', 'submitted')
           )
           OR (
             m.role IN ('owner', 'admin', 'compliance_admin')
             AND org_control_attestations.claimed_by IS DISTINCT FROM auth.uid()
           )
         )
    )
  );
