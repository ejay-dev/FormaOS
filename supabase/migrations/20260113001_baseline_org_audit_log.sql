-- Baseline DDL for public.org_audit_log — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table without ever issuing CREATE TABLE (only the *plural*
-- public.org_audit_logs is created in 20250101_000_base_schema.sql). Prod has
-- BOTH the singular and plural variants. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod.

CREATE TABLE IF NOT EXISTS public.org_audit_log (
  id              uuid         NOT NULL DEFAULT gen_random_uuid(),
  org_id          uuid         NOT NULL,
  actor_user_id   uuid,
  action          text         NOT NULL,
  entity          text,
  entity_id       uuid,
  meta            jsonb        NOT NULL DEFAULT '{}'::jsonb,
  ip              inet,
  user_agent      text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
