-- Add payment_failed_at column to org_subscriptions
-- Required by billing webhook handler for invoice.paid / invoice.payment_failed events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_subscriptions'
      AND column_name = 'payment_failed_at'
  ) THEN
    ALTER TABLE public.org_subscriptions ADD COLUMN payment_failed_at timestamptz;
  END IF;
END $$;
