-- Baseline DDL for public.memberships — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.
--
-- Note: prod has both organization_id and org_id columns (historical drift).
-- Both reproduced as-is; either is nullable.

CREATE TABLE IF NOT EXISTS public.memberships (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid,
  organization_id  uuid,
  role             text         NOT NULL,
  created_at       timestamptz  DEFAULT now(),
  org_id           uuid,
  PRIMARY KEY (id)
);
