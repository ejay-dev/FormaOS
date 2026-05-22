-- Baseline DDL for public.file_versions — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.file_versions (
  id              uuid         NOT NULL DEFAULT gen_random_uuid(),
  file_id         uuid         NOT NULL,
  version_number  integer      NOT NULL,
  file_name       varchar      NOT NULL,
  file_path       text         NOT NULL,
  file_size       bigint       NOT NULL,
  mime_type       varchar      NOT NULL,
  uploaded_by     uuid         NOT NULL,
  change_summary  text,
  checksum        varchar      NOT NULL,
  created_at      timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
