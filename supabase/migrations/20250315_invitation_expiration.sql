-- Migration: Add expiration to team_invitations
-- Run this to add expires_at column and index for invitation validation

BEGIN;

-- Add expires_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add accepted_by and accepted_at columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'accepted_by'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN accepted_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add revoked_by and revoked_at columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'revoked_by'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN revoked_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token 
ON public.team_invitations(token) WHERE status = 'pending';

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at 
ON public.team_invitations(expires_at) WHERE status = 'pending';

-- Update existing pending invitations with expiration (7 days from now)
UPDATE public.team_invitations 
SET expires_at = NOW() + INTERVAL '7 days'
WHERE status = 'pending' AND expires_at IS NULL;

-- Add default value for status column if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_invitations' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

COMMIT;

