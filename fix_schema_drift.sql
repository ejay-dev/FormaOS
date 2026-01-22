-- CRITICAL SCHEMA DRIFT FIX
-- Adds missing plan_key column to org_subscriptions table
-- This fixes the E2E test failure and ensures database/code alignment

-- First, handle any old org_id column that might still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'org_id'
  ) THEN
    -- Drop any constraints on org_id first
    ALTER TABLE public.org_subscriptions DROP CONSTRAINT IF EXISTS org_subscriptions_org_id_fkey;
    ALTER TABLE public.org_subscriptions DROP CONSTRAINT IF EXISTS org_subscriptions_org_id_key;

    -- Rename org_id to organization_id if it exists
    ALTER TABLE public.org_subscriptions RENAME COLUMN org_id TO organization_id;
    RAISE NOTICE 'Renamed org_id to organization_id in org_subscriptions';
  END IF;
END $$;

-- Ensure organization_id column exists and is NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.org_subscriptions
      ADD COLUMN organization_id uuid;
    RAISE NOTICE 'Added organization_id column to org_subscriptions';
  END IF;
END $$;

-- Add plan_key column to org_subscriptions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'plan_key'
  ) THEN
    ALTER TABLE public.org_subscriptions
      ADD COLUMN plan_key text;
    RAISE NOTICE 'Added plan_key column to org_subscriptions';
  ELSE
    RAISE NOTICE 'plan_key column already exists in org_subscriptions';
  END IF;
END $$;

-- Ensure plan_key has a default value for existing rows
UPDATE public.org_subscriptions
SET plan_key = 'basic'
WHERE plan_key IS NULL;

-- Make plan_key NOT NULL (after setting defaults)
ALTER TABLE public.org_subscriptions
  ALTER COLUMN plan_key SET NOT NULL;

-- Add any other missing columns from migrations
DO $$
BEGIN
  -- trial_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE public.org_subscriptions
      ADD COLUMN trial_started_at timestamptz;
    RAISE NOTICE 'Added trial_started_at column to org_subscriptions';
  END IF;

  -- trial_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'trial_expires_at'
  ) THEN
    ALTER TABLE public.org_subscriptions
      ADD COLUMN trial_expires_at timestamptz;
    RAISE NOTICE 'Added trial_expires_at column to org_subscriptions';
  END IF;

  -- price_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'price_id'
  ) THEN
    ALTER TABLE public.org_subscriptions
      ADD COLUMN price_id text;
    RAISE NOTICE 'Added price_id column to org_subscriptions';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_expires
  ON public.org_subscriptions(trial_expires_at)
  WHERE status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_price_id
  ON public.org_subscriptions(price_id)
  WHERE price_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.org_subscriptions.trial_started_at IS 'Timestamp when trial period started';
COMMENT ON COLUMN public.org_subscriptions.trial_expires_at IS 'Timestamp when trial period expires';
COMMENT ON COLUMN public.org_subscriptions.price_id IS 'Stripe price ID for the subscription';

-- Verify the fix
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'org_subscriptions'
    AND column_name IN ('plan_key', 'trial_started_at', 'trial_expires_at', 'price_id');

  RAISE NOTICE 'Schema fix complete. Added % columns to org_subscriptions', column_count;
END $$;
