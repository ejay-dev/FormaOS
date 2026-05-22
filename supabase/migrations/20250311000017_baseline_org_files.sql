-- Baseline DDL for public.org_files — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-001 (P1): the historical migrations DROP/CREATE POLICY
-- this table but never CREATE TABLE it. This file bridges the gap so a fresh
-- `supabase db reset` reproduces prod schema. Idempotent (IF NOT EXISTS) so
-- safe to run against prod — verified by Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS public.org_files (
  id           uuid         NOT NULL DEFAULT gen_random_uuid(),
  org_id       uuid         NOT NULL,
  bucket_id    text         NOT NULL DEFAULT 'org-files',
  object_path  text         NOT NULL,
  mime_type    text,
  size_bytes   bigint,
  created_by   uuid,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
