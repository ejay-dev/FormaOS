-- Migration: Fix Missing Trial and Price Columns
-- Date: 2024
-- Purpose: Add missing columns required for trial and billing functionality
-- This fixes critical production-blocking issues identified in audit

-- Add trial tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE public.org_subscriptions 
      ADD COLUMN trial_started_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE public.org_subscriptions 
      ADD COLUMN trial_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'price_id'
  ) THEN
    ALTER TABLE public.org_subscriptions 
      ADD COLUMN price_id text;
  END IF;
END $$;

-- Add index for trial expiration queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_expires 
  ON public.org_subscriptions(trial_expires_at) 
  WHERE status = 'trialing';

-- Add index for price_id lookups
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_price_id 
  ON public.org_subscriptions(price_id) 
  WHERE price_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.org_subscriptions.trial_started_at IS 'Timestamp when trial period started';
COMMENT ON COLUMN public.org_subscriptions.trial_expires_at IS 'Timestamp when trial period expires';
COMMENT ON COLUMN public.org_subscriptions.price_id IS 'Stripe price ID for the subscription';
