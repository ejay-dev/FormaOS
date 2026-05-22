-- 20260204_fix_team_invitation_select.sql
-- Allow invitees to SELECT their invitation rows by email

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_invitations'
  ) THEN
    DROP POLICY IF EXISTS "invitations_self_select" ON public.team_invitations;

    CREATE POLICY "invitations_self_select"
      ON public.team_invitations
      FOR SELECT
      USING (
        email = auth.jwt() ->> 'email'
        OR organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

COMMIT;
