-- Billing events idempotency state machine
--
-- Background:
--   Previously the webhook handler at app/api/billing/webhook/route.ts inserted
--   each Stripe event id into billing_events BEFORE running side effects.
--   When side effects threw, the route returned 500 and Stripe retried, but the
--   retry's INSERT hit the unique constraint and short-circuited as "already
--   processed", leaving the original side effect permanently lost
--   (audit P0 finding #3 in docs/deep-codebase-audit.md).
--
--   This migration adds a state machine to billing_events so the handler can
--   distinguish between "succeeded" (true duplicate, safe to no-op) and
--   "pending|failed" (claim and retry).
--
-- Columns (all idempotent):
--   - status            text  ('pending' | 'succeeded' | 'failed')
--   - attempts          int   (incremented per claim)
--   - started_at        timestamptz (set when an attempt begins)
--   - completed_at      timestamptz (set on succeeded or failed)
--   - last_error        text  (truncated stack/message of last failure)
--
-- Existing rows are migrated to status='succeeded' so historical no-op
-- behavior is preserved (their side effects either landed or never will, but
-- we don't retry them on next webhook redelivery).

BEGIN;

ALTER TABLE public.billing_events
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

-- Backfill: rows that pre-date this migration are treated as already handled.
UPDATE public.billing_events
SET status = COALESCE(status, 'succeeded'),
    completed_at = COALESCE(completed_at, created_at, now())
WHERE status IS NULL;

-- Default and constraint after backfill
ALTER TABLE public.billing_events
  ALTER COLUMN status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'billing_events_status_check'
      AND conrelid = 'public.billing_events'::regclass
  ) THEN
    ALTER TABLE public.billing_events
      ADD CONSTRAINT billing_events_status_check
      CHECK (status IN ('pending', 'succeeded', 'failed'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS billing_events_status_idx
  ON public.billing_events (status, started_at);

COMMIT;
