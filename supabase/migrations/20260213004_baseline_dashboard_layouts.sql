-- Baseline DDL for public.dashboard_layouts — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260403001_dashboard_builder.sql. This file
-- bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.
--
-- Note: prod has both organization_id and org_id columns (historical drift).
-- Both reproduced as-is; either is nullable in the org_id case.

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  id                uuid         NOT NULL DEFAULT gen_random_uuid(),
  widget_id         varchar      NOT NULL,
  organization_id   uuid         NOT NULL,
  widget_type       varchar      NOT NULL,
  title             varchar      NOT NULL,
  size              varchar      DEFAULT 'medium'::varchar,
  position          jsonb        DEFAULT '{"x": 0, "y": 0}'::jsonb,
  refresh_interval  integer      DEFAULT 60,
  settings          jsonb        DEFAULT '{}'::jsonb,
  enabled           boolean      DEFAULT true,
  created_at        timestamptz  DEFAULT now(),
  updated_at        timestamptz  DEFAULT now(),
  user_id           uuid,
  name              text         DEFAULT 'My Dashboard'::text,
  is_default        boolean      DEFAULT false,
  widgets           jsonb        DEFAULT '[]'::jsonb,
  org_id            uuid,
  PRIMARY KEY (id)
);
