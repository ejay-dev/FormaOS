-- Baseline DDL for public.webhook_configs — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id  uuid         NOT NULL,
  name             varchar      NOT NULL,
  url              text         NOT NULL,
  events           jsonb        DEFAULT '[]'::jsonb,
  secret           varchar      NOT NULL,
  enabled          boolean      DEFAULT true,
  retry_count      integer      DEFAULT 3,
  headers          jsonb        DEFAULT '{}'::jsonb,
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
