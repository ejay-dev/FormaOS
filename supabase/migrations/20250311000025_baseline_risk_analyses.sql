-- Baseline DDL for public.risk_analyses — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.risk_analyses (
  id                  uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id     uuid         NOT NULL,
  overall_risk_score  integer      NOT NULL,
  risk_level          varchar      NOT NULL,
  total_risks         integer      DEFAULT 0,
  risks_by_category   jsonb        DEFAULT '{}'::jsonb,
  risks_by_severity   jsonb        DEFAULT '{}'::jsonb,
  top_risks           jsonb        DEFAULT '[]'::jsonb,
  trends              jsonb        DEFAULT '{}'::jsonb,
  recommendations     jsonb        DEFAULT '[]'::jsonb,
  created_at          timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
