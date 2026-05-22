-- Baseline DDL for public.form_responses — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.form_responses (
  id                  uuid         NOT NULL DEFAULT gen_random_uuid(),
  form_id             uuid         NOT NULL,
  organization_id     uuid         NOT NULL,
  data                jsonb        NOT NULL,
  submitted_by        uuid,
  submitted_by_email  text,
  ip_address          text,
  user_agent          text,
  metadata            jsonb        DEFAULT '{}'::jsonb,
  created_at          timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
