-- public.org_controls — view aliasing org_control_evaluations for callers
-- that expect the table-name shape from a prior schema. Resolves the
-- audit's compliance-001 (P0, 2026-05-22) without refactoring 9 call
-- sites in one PR.
--
-- Background:
--   `org_control_evaluations` (1791 rows in prod) holds the actual
--   control-evaluation records. 9 code paths still query `org_controls`,
--   a relation that was renamed/never-shipped. Every query against
--   org_controls silently returned no rows. Surfaces affected per audit:
--     - lib/compliance/unified-score.ts
--     - app/app/compliance/cross-map/page.tsx
--     - app/app/dashboard/builder/page.tsx
--     - app/audit-portal/[token]/page.tsx
--     - app/audit-portal/[token]/controls/page.tsx
--     - app/api/v1/evidence/suggest-mappings/route.ts
--     - app/api/cron/compliance-check/route.ts
--     - lib/executive/digest-generator.ts
--     - lib/evidence/smart-mapper.ts
--
-- The view is SECURITY INVOKER so the caller's RLS on
-- org_control_evaluations applies. Columns are mapped to satisfy the
-- existing call sites without changing their code:
--
--   id              ← org_control_evaluations.id
--   organization_id ← org_control_evaluations.organization_id
--   org_id          ← organization_id (legacy alias)
--   status          ← org_control_evaluations.status
--   framework_id    ← org_control_evaluations.framework_id
--   code            ← framework_controls.control_code (joined)
--   title           ← framework_controls.title (joined)
--   control_key     ← org_control_evaluations.control_key
--   framework       ← frameworks.slug (joined)
--   latest_evidence_id ← most-recent control_evidence.evidence_id for
--                        this control (subquery LIMIT 1)
--
-- If a code call site needs additional columns later, extend the view
-- rather than re-querying the underlying table.

CREATE OR REPLACE VIEW public.org_controls
WITH (security_invoker = on)
AS
SELECT
  ev.id,
  ev.organization_id,
  ev.organization_id AS org_id,
  ev.status,
  ev.framework_id,
  fc.control_code AS code,
  fc.title,
  ev.control_key,
  f.slug AS framework,
  ev.required,
  ev.last_evaluated_at,
  ev.created_at,
  (
    SELECT ce.evidence_id
    FROM public.control_evidence ce
    WHERE ce.control_id = ev.id
      AND ce.organization_id = ev.organization_id
    ORDER BY ce.created_at DESC
    LIMIT 1
  ) AS latest_evidence_id
FROM public.org_control_evaluations ev
LEFT JOIN public.framework_controls fc
  ON fc.control_code = ev.control_key
  AND fc.framework_id = ev.framework_id
LEFT JOIN public.frameworks f
  ON f.id = ev.framework_id;

COMMENT ON VIEW public.org_controls IS
  'Audit compliance-001 (2026-05-22): SECURITY INVOKER alias view over org_control_evaluations + framework_controls + frameworks + control_evidence. Created to unblock 9 call sites that query a relation named org_controls. Replace with a refactor to org_control_evaluations when the surface area is small enough to grep-replace in one PR.';
