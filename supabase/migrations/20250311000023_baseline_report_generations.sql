-- Baseline DDL for public.report_generations — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.report_generations (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id  uuid         NOT NULL,
  template_id      uuid         NOT NULL,
  generated_by     uuid,
  format           varchar      NOT NULL,
  file_path        text,
  status           varchar      DEFAULT 'pending',
  error_message    text,
  created_at       timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
