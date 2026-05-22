-- Add PHI and encryption tracking fields to org_assets
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_assets'
  ) THEN
    ALTER TABLE public.org_assets
      ADD COLUMN IF NOT EXISTS contains_phi boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS encrypted_at_rest boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS encrypted_in_transit boolean NOT NULL DEFAULT false;
  END IF;
END
$$;

