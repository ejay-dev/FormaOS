-- Baseline DDL for public.framework_control_mappings — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260403003_framework_cross_mapping.sql. This
-- file bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.framework_control_mappings (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  master_control_id     uuid,
  framework_control_id  uuid,
  mapping_confidence    numeric      DEFAULT 1.0,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  source_framework      text,
  source_control_id     text,
  target_framework      text,
  target_control_id     text,
  mapping_strength      text         DEFAULT 'related'::text,
  notes                 text,
  PRIMARY KEY (id)
);
