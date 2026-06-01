-- Investigation structured RCA payload
-- =====================================
-- The structured root-cause-analysis UI (5-Whys / Fishbone / Timeline /
-- Barrier analysis) produces methodology-specific data that has no home in
-- org_investigations today (only root_cause TEXT and contributing_factors
-- JSONB exist). This adds a single JSONB column to persist the per-methodology
-- payload (e.g. { whys: [...] } or { fishbone: {...} }), so the wired
-- InvestigationForm can round-trip its output. Additive and idempotent.

ALTER TABLE public.org_investigations
  ADD COLUMN IF NOT EXISTS analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.org_investigations.analysis_data IS
  'Methodology-specific structured RCA payload (whys/fishbone/timeline/barriers) produced by the investigation form. root_cause and contributing_factors remain in their own columns.';
