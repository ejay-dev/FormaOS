-- Baseline DDL for public.compliance_scans — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.compliance_scans (
  id                  uuid               NOT NULL DEFAULT gen_random_uuid(),
  scan_id             varchar            NOT NULL,
  organization_id     uuid               NOT NULL,
  framework           varchar            NOT NULL,
  scan_type           varchar            NOT NULL,
  started_at          timestamptz        NOT NULL,
  completed_at        timestamptz        NOT NULL,
  total_requirements  integer            DEFAULT 0,
  compliant           integer            DEFAULT 0,
  non_compliant       integer            DEFAULT 0,
  partial             integer            DEFAULT 0,
  not_applicable      integer            DEFAULT 0,
  compliance_score    integer            NOT NULL,
  findings            jsonb              DEFAULT '[]'::jsonb,
  recommendations     jsonb              DEFAULT '[]'::jsonb,
  created_at          timestamptz        DEFAULT now(),
  PRIMARY KEY (id)
);
