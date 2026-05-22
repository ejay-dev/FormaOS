-- Baseline DDL for public.care_task_templates — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.care_task_templates (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  industry_id           uuid         NOT NULL,
  register_template_id  uuid,
  code                  text         NOT NULL,
  name                  text         NOT NULL,
  description           text,
  frequency             text,
  default_due_days      integer,
  is_active             boolean      NOT NULL DEFAULT true,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
