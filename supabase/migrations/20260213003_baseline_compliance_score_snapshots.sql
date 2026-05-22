-- Baseline DDL for public.compliance_score_snapshots — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260409_compliance_snapshots.sql. This file
-- bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.compliance_score_snapshots (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id       uuid         NOT NULL,
  framework_slug        text         NOT NULL,
  snapshot_date         date         NOT NULL DEFAULT CURRENT_DATE,
  compliance_score      integer      NOT NULL,
  total_controls        integer      NOT NULL DEFAULT 0,
  satisfied_controls    integer      NOT NULL DEFAULT 0,
  partial_controls      integer      NOT NULL DEFAULT 0,
  missing_controls      integer      NOT NULL DEFAULT 0,
  evidence_count        integer      NOT NULL DEFAULT 0,
  task_completion_rate  numeric      DEFAULT 0,
  metadata              jsonb        DEFAULT '{}'::jsonb,
  captured_at           timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
