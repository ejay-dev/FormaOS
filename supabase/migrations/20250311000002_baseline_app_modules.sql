-- Baseline DDL for public.app_modules — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.app_modules (
  code         text         NOT NULL,
  name         text         NOT NULL,
  description  text,
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (code)
);
