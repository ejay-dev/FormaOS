-- Audit 2026-05-26 — deterministic tiebreak in public.org_controls view.
--
-- Background (Database M1): the `latest_evidence_id` subquery in
-- 20260624005's view orders by `ce.created_at DESC LIMIT 1`. Two
-- evidence rows inserted in the same `now()` tick (which happens
-- under bulk-import or compliance reruns where multiple controls
-- attach evidence simultaneously) produce a non-deterministic
-- winner — Postgres can return either row depending on storage layout.
--
-- Add `, ce.id DESC` as a stable secondary sort key. UUIDs sort
-- lexicographically; since they're generated independently per
-- row, this gives us a canonical "newest" choice even on ties.

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
    ORDER BY ce.created_at DESC, ce.id DESC
    LIMIT 1
  ) AS latest_evidence_id
FROM public.org_control_evaluations ev
LEFT JOIN public.framework_controls fc
  ON fc.control_code = ev.control_key
  AND fc.framework_id = ev.framework_id
LEFT JOIN public.frameworks f
  ON f.id = ev.framework_id;
