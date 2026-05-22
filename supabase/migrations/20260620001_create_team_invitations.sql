-- Migration: Create team_invitations table
-- This is the canonical CREATE TABLE statement for team_invitations.
-- Subsequent migrations (ALTER TABLE, RLS policies, indexes) depend on this table existing.

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_email_status
  ON public.team_invitations(organization_id, email, status);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token
  ON public.team_invitations(token)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at
  ON public.team_invitations(expires_at)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Org members (owner/admin) can manage invitations for their org
CREATE POLICY "team_invitations_manage_own_org"
  ON public.team_invitations
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Invited users can view their own pending invitation by email
CREATE POLICY "team_invitations_view_own_by_email"
  ON public.team_invitations
  FOR SELECT
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
