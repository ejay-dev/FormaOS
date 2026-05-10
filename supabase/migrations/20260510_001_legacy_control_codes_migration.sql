-- Phase 1.5: legacy control-code migration (schema half)
--
-- Phase 1 (PR #36) added the standard SOC 2 TSC and ISO 27001:2022 Annex A
-- packs alongside the legacy ones. Phase 1.5 starts the cut-over.
--
-- This SQL migration handles the schema-side of the cut-over:
--   1. Adds `is_deprecated` columns to `compliance_controls` and
--      `framework_controls` so dashboards can hide retired controls.
--   2. Marks the existing legacy SOC 2 (`SOC2-*`) and ISO 27001
--      (`ISO-*`) control rows as deprecated. The marking is purely by
--      control_code prefix and is therefore safe to run before or after
--      the new framework rows have loaded.
--
-- The org-data half (org_control_evaluations remap, evidence handling)
-- runs in TypeScript via lib/compliance/legacy-control-mapping.ts —
-- triggered from `ensureFrameworkPacksInstalled` so it executes after
-- the new framework rows are guaranteed to exist. Idempotent.

ALTER TABLE public.compliance_controls
  ADD COLUMN IF NOT EXISTS is_deprecated boolean NOT NULL DEFAULT false;

ALTER TABLE public.framework_controls
  ADD COLUMN IF NOT EXISTS is_deprecated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_compliance_controls_is_deprecated
  ON public.compliance_controls (framework_id, is_deprecated);

CREATE INDEX IF NOT EXISTS idx_framework_controls_is_deprecated
  ON public.framework_controls (framework_id, is_deprecated);

-- Mark legacy SOC 2 controls. The legacy pack used the SOC2-{S,A,C,PI,P}
-- internal codes (SOC2-S1..S3, SOC2-A1..A2, SOC2-C1..C2, SOC2-PI1..PI2,
-- SOC2-P1..P2). The new TSC pack uses the AICPA-standard codes
-- (CC1.1..CC9.2, A1.1..A1.3, C1.1..C1.2, PI1.1..PI1.5, P1.1..P8.1).
UPDATE public.compliance_controls
   SET is_deprecated = true
 WHERE code LIKE 'SOC2-%';

UPDATE public.framework_controls
   SET is_deprecated = true
 WHERE control_code LIKE 'SOC2-%';

-- Mark legacy ISO 27001 controls. The legacy pack used the ISO-A.* prefix
-- on the 2013-era subset (ISO-A.5.1..A.18.1). The new pack uses the
-- ISO 27001:2022 Annex A naming directly (A.5.* / A.6.* / A.7.* / A.8.*).
UPDATE public.compliance_controls
   SET is_deprecated = true
 WHERE code LIKE 'ISO-%';

UPDATE public.framework_controls
   SET is_deprecated = true
 WHERE control_code LIKE 'ISO-%';
