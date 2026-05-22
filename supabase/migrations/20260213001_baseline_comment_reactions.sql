-- Baseline DDL for public.comment_reactions — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql without ever issuing
-- CREATE TABLE. This file bridges the gap so a fresh `supabase db reset`
-- reproduces prod schema. Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id          uuid         NOT NULL DEFAULT gen_random_uuid(),
  comment_id  uuid         NOT NULL,
  user_id     uuid         NOT NULL,
  emoji       varchar      NOT NULL,
  created_at  timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
