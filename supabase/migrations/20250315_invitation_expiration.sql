-- Migration: Add expiration to team_invitations
-- Run this to add expires_at column and index for invitation validation
--
-- All ALTER/INDEX/UPDATE operations are guarded by a table-existence check
-- so this migration no-ops cleanly on environments that have not yet run
-- 20260620_001_create_team_invitations.sql (the canonical CREATE TABLE).
-- Once that migration runs, the columns and indexes here are already
-- defined inline, so this migration's effective scope shrinks to zero on
-- fresh DBs while remaining a no-op on production (already applied).

BEGIN;

DO $$
BEGIN
  -- Skip the entire migration body when the table is absent; a fresh DB
  -- will pick up the canonical schema from the later CREATE TABLE migration.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_invitations'
  ) THEN
    RAISE NOTICE 'team_invitations not present yet — skipping invitation_expiration columns/indexes';
    RETURN;
  END IF;

  -- Add expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'team_invitations'
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add accepted_by and accepted_at columns if they don't exist
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

  -- Add revoked_by and revoked_at columns if they don't exist
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

  -- Add default value for status column if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'team_invitations'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.team_invitations ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  -- Create indexes (idempotent)
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token) WHERE status = ''pending''';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at) WHERE status = ''pending''';

  -- Update existing pending invitations with expiration (7 days from now)
  UPDATE public.team_invitations
  SET expires_at = NOW() + INTERVAL '7 days'
  WHERE status = 'pending' AND expires_at IS NULL;
END $$;

COMMIT;

