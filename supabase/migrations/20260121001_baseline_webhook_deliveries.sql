-- Baseline DDL for public.webhook_deliveries — prod-derived schema captured 2026-05-22.
-- Audit v2-migration-003 (P3): the historical migrations DROP/CREATE POLICY on
-- this table at 20260122000_add_default_rls_policies.sql, but the CREATE TABLE
-- statement does not appear until 20260315005_webhook_deliveries.sql. This
-- file bridges the gap so a fresh `supabase db reset` reproduces prod schema.
-- Idempotent (IF NOT EXISTS) so safe to run against prod.

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  webhook_id       uuid         NOT NULL,
  event            varchar      NOT NULL,
  payload          jsonb        NOT NULL,
  status           varchar      DEFAULT 'pending'::varchar,
  response_code    integer,
  response_body    text,
  error_message    text,
  attempts         integer      DEFAULT 1,
  delivered_at     timestamptz,
  created_at       timestamptz  DEFAULT now(),
  PRIMARY KEY (id)
);
