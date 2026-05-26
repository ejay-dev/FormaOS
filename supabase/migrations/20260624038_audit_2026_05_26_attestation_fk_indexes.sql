-- Audit 2026-05-26 — index foreign keys on org_control_attestations.
--
-- STATUS: SKIPPED on 2026-05-26 deploy. The target table does not exist
-- in production (verified via information_schema). Re-evaluate alongside
-- migration 037 if/when org_control_attestations is reintroduced.
--
-- Background (Database M2): the table from migration 20260624021 has
-- FKs on `framework_id`, `claimed_by`, `reviewed_by`, and `evidence_id`
-- but none of them are indexed. `framework_id` is part of the
-- compound index `org_control_attestations_org_fw_ctrl_idx` (which
-- helps queries that filter by org+framework+control), but ad-hoc
-- queries that filter by reviewer alone — or DELETEs that cascade
-- from framework / evidence / user_id — do full table scans.
--
-- `evidence_id` is especially load-bearing: it has ON DELETE RESTRICT,
-- so every evidence delete must table-scan attestations to verify no
-- references exist. With even a few thousand attestations this is
-- slow enough to be user-visible.
--
-- Use partial indexes where the column is nullable so we don't index
-- the (frequent) NULL state — Postgres skips NULLs in those indexes
-- which keeps them small.

CREATE INDEX IF NOT EXISTS org_control_attestations_claimed_by_idx
  ON public.org_control_attestations (claimed_by)
  WHERE claimed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS org_control_attestations_reviewed_by_idx
  ON public.org_control_attestations (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS org_control_attestations_evidence_id_idx
  ON public.org_control_attestations (evidence_id)
  WHERE evidence_id IS NOT NULL;
