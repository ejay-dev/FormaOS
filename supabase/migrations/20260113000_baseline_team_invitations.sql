-- Baseline DDL for public.team_invitations — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table starting at 20260114001_security_hardening.sql, but the CREATE TABLE
-- statement does not appear until 20260620001_create_team_invitations.sql. This
-- file bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  organization_id  uuid         NOT NULL,
  email            text         NOT NULL,
  role             text         NOT NULL DEFAULT 'member',
  token            text         NOT NULL,
  invited_by       uuid         NOT NULL,
  status           text         NOT NULL DEFAULT 'pending',
  expires_at       timestamptz  NOT NULL DEFAULT (now() + interval '7 days'),
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now(),
  accepted_by      uuid,
  accepted_at      timestamptz,
  revoked_by       uuid,
  revoked_at       timestamptz,
  PRIMARY KEY (id)
);
