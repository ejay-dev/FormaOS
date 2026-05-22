-- Baseline DDL for public.user_sessions — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260214000_fix_all_supabase_warnings.sql, but the CREATE TABLE
-- statement does not appear until 20260601_security_hardening_v2.sql. This file
-- bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id                   uuid         NOT NULL DEFAULT gen_random_uuid(),
  user_id              uuid         NOT NULL,
  session_token_hash   text         NOT NULL,
  ip_address           inet,
  user_agent           text,
  device_fingerprint   text,
  last_active_at       timestamptz  DEFAULT now(),
  expires_at           timestamptz  NOT NULL,
  revoked_at           timestamptz,
  created_at           timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
