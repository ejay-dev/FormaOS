-- Baseline DDL for public.tasks — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.tasks (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id  uuid,
  title            text         NOT NULL,
  assigned_to      uuid,
  status           text         DEFAULT 'open',
  due_date         date,
  created_at       timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
