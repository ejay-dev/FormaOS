-- Baseline DDL for public.org_compliance_status — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.org_compliance_status (
  organization_id        uuid         NOT NULL,
  at_risk                boolean      NOT NULL DEFAULT false,
  risk_level             text         NOT NULL DEFAULT 'low',
  risk_reason            text,
  last_framework_code    text,
  last_score             integer      NOT NULL DEFAULT 0,
  last_total_controls    integer      NOT NULL DEFAULT 0,
  last_missing_controls  integer      NOT NULL DEFAULT 0,
  last_partial_controls  integer      NOT NULL DEFAULT 0,
  last_evaluated_at      timestamptz,
  updated_at             timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id)
);
