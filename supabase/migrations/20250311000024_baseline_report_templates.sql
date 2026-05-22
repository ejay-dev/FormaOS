-- Baseline DDL for public.report_templates — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.report_templates (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id  uuid         NOT NULL,
  name             varchar      NOT NULL,
  description      text,
  widgets          jsonb        DEFAULT '[]'::jsonb,
  layout           jsonb        DEFAULT '{}'::jsonb,
  schedule         jsonb,
  created_by       uuid         NOT NULL,
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
