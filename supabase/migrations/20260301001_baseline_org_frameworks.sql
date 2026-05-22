-- Baseline DDL for public.org_frameworks — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260302000_rename_org_frameworks_org_id.sql, but the CREATE
-- TABLE statement does not appear until 20260408_framework_engine_phase2.sql.
-- This file bridges the gap so a fresh `supabase db reset` reproduces prod
-- schema. Idempotent (IF NOT EXISTS) so safe to run against prod.
--
-- Composite primary key (organization_id, framework_slug) per prod.

CREATE TABLE IF NOT EXISTS public.org_frameworks (
  organization_id  uuid         NOT NULL,
  framework_slug   text         NOT NULL,
  enabled_at       timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, framework_slug)
);
