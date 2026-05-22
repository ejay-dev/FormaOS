-- Baseline DDL for public.billing_plans — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.billing_plans (
  code         text         NOT NULL,
  name         text         NOT NULL,
  price_cents  integer      NOT NULL DEFAULT 0,
  interval     text         NOT NULL DEFAULT 'month',
  max_users    integer,
  features     jsonb        NOT NULL DEFAULT '{}'::jsonb,
  is_active    boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (code)
);
