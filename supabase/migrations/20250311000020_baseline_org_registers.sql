-- Baseline DDL for public.org_registers — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.org_registers (
  id           uuid         NOT NULL DEFAULT gen_random_uuid(),
  org_id       uuid         NOT NULL,
  template_id  uuid,
  code         text         NOT NULL,
  name         text,
  category     text,
  description  text,
  fields       jsonb        NOT NULL DEFAULT '[]'::jsonb,
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  type         text,
  status       text         DEFAULT 'active',
  risk_level   text         DEFAULT 'low',
  criticality  text         DEFAULT 'medium',
  owner_email  text,
  PRIMARY KEY (id)
);
