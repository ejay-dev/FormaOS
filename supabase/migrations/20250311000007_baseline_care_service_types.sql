-- Baseline DDL for public.care_service_types — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.care_service_types (
  id           uuid         NOT NULL DEFAULT gen_random_uuid(),
  industry_id  uuid         NOT NULL,
  code         text         NOT NULL,
  name         text         NOT NULL,
  description  text,
  is_active    boolean      NOT NULL DEFAULT true,
  sort_order   integer      NOT NULL DEFAULT 100,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
