-- 20260204_backfill_user_profiles.sql
-- Backfill missing user_profiles rows from org_members and ensure new memberships get profiles

BEGIN;

DO $$
DECLARE
  org_col TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'org_members'
        AND column_name = 'organization_id'
    ) THEN
      org_col := 'organization_id';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'org_members'
        AND column_name = 'org_id'
    ) THEN
      org_col := 'org_id';
    END IF;

    IF org_col IS NOT NULL THEN
      EXECUTE format(
        'INSERT INTO public.user_profiles (user_id, organization_id)
         SELECT m.user_id, m.%I
         FROM public.org_members m
         LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
         WHERE up.user_id IS NULL
           AND m.user_id IS NOT NULL
           AND m.%I IS NOT NULL
         ON CONFLICT (user_id) DO NOTHING',
        org_col,
        org_col
      );
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile_from_org_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
      AND column_name = 'organization_id'
  ) THEN
    org_id := NEW.organization_id;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
      AND column_name = 'org_id'
  ) THEN
    org_id := NEW.org_id;
  ELSE
    RETURN NEW;
  END IF;

  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_profiles (user_id, organization_id)
  VALUES (NEW.user_id, org_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ensure_user_profile_from_org_member ON public.org_members;
CREATE TRIGGER ensure_user_profile_from_org_member
  AFTER INSERT ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile_from_org_member();

COMMIT;
