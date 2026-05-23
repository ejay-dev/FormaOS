-- v4-006: 5 tenant tables have organization_id columns with no FK constraint
-- pointing at organizations(id). Same bug class as v3-010 (control_tasks):
-- when an organization is deleted, child rows become orphans and the
-- regression gate has to chase them after the fact.
--
-- Audit-traced 2026-05-23 (orphan + null pre-flight passed):
--   control_evidence     — 74 rows,  0 orphans, 0 null org_ids
--   org_audit_events     — 2  rows,  0 orphans
--   org_certifications   — 0  rows,  0 orphans
--   org_entities         — 0  rows,  0 orphans
--   org_entity_members   — 0  rows,  0 orphans
--
-- Cascade behavior: ON DELETE CASCADE matches the v3-010 pattern. When
-- an org is deleted, audit/evidence/certifications rows should go with
-- it (no orphan compliance artifacts; nothing to point them at).

BEGIN;

ALTER TABLE public.control_evidence
  ADD CONSTRAINT control_evidence_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.org_audit_events
  ADD CONSTRAINT org_audit_events_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.org_certifications
  ADD CONSTRAINT org_certifications_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.org_entities
  ADD CONSTRAINT org_entities_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

ALTER TABLE public.org_entity_members
  ADD CONSTRAINT org_entity_members_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

COMMIT;
