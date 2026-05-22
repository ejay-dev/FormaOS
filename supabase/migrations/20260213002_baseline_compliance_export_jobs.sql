-- Baseline DDL for public.compliance_export_jobs — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260409_compliance_snapshots.sql. This file
-- bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.compliance_export_jobs (
  id                  uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id     uuid         NOT NULL,
  framework_slug      text         NOT NULL,
  requested_by        uuid         NOT NULL,
  status              text         NOT NULL DEFAULT 'pending'::text,
  progress            integer      DEFAULT 0,
  file_url            text,
  file_size           bigint,
  password_protected  boolean      DEFAULT false,
  error_message       text,
  metadata            jsonb        DEFAULT '{}'::jsonb,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  expires_at          timestamptz,
  attempt_count       integer      NOT NULL DEFAULT 0,
  next_run_at         timestamptz  DEFAULT now(),
  locked_at           timestamptz,
  locked_by           text,
  last_error          text,
  PRIMARY KEY (id)
);
