-- Baseline DDL for public.integration_configs — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260311002_integration_sync.sql. This file
-- bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.integration_configs (
  id                uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id   uuid         NOT NULL,
  integration_type  varchar      NOT NULL,
  name              varchar      NOT NULL,
  webhook_url       text,
  channel           varchar,
  enabled           boolean      DEFAULT true,
  events            jsonb        DEFAULT '[]'::jsonb,
  headers           jsonb        DEFAULT '{}'::jsonb,
  retry_count       integer      DEFAULT 3,
  created_at        timestamptz  DEFAULT now(),
  updated_at        timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
