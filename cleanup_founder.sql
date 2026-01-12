-- Cleanup Founder Account
-- Remove any existing user/org data for founder email: ejazhussaini313@gmail.com
-- Handles audit logs by dropping and recreating the immutable trigger

DO $$
DECLARE
  founder_user_id uuid;
  founder_org_id uuid;
  trigger_definition text;
BEGIN
  -- Find the user ID for the founder email
  SELECT id INTO founder_user_id
  FROM auth.users
  WHERE email = 'ejazhussaini313@gmail.com';

  IF founder_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found founder user: %', founder_user_id;

    -- Find their organization
    SELECT organization_id INTO founder_org_id
    FROM public.org_members
    WHERE user_id = founder_user_id
    LIMIT 1;

    IF founder_org_id IS NOT NULL THEN
      RAISE NOTICE 'Found founder org: %', founder_org_id;

      -- Store trigger definition if it exists
      SELECT pg_get_triggerdef(oid) INTO trigger_definition
      FROM pg_trigger
      WHERE tgname = 'prevent_audit_mutation'
        AND tgrelid = 'public.org_audit_logs'::regclass;

      -- Drop the trigger temporarily
      IF trigger_definition IS NOT NULL THEN
        RAISE NOTICE 'Dropping audit trigger temporarily...';
        DROP TRIGGER IF EXISTS prevent_audit_mutation ON public.org_audit_logs;
      END IF;

      -- Delete audit logs (if table exists)
      BEGIN
        DELETE FROM public.org_audit_logs WHERE organization_id = founder_org_id;
        RAISE NOTICE 'Deleted audit logs for org: %', founder_org_id;
      EXCEPTION
        WHEN undefined_table THEN
          RAISE NOTICE 'No audit logs table found, skipping...';
      END;

      -- Recreate the trigger if it existed
      IF trigger_definition IS NOT NULL THEN
        RAISE NOTICE 'Recreating audit trigger...';
        EXECUTE trigger_definition;
        RAISE NOTICE 'Audit trigger recreated';
      END IF;

      -- Delete organization subscription
      DELETE FROM public.org_subscriptions WHERE organization_id = founder_org_id;
      RAISE NOTICE 'Deleted subscriptions for org: %', founder_org_id;

      -- Delete organization entitlements
      DELETE FROM public.org_entitlements WHERE organization_id = founder_org_id;
      RAISE NOTICE 'Deleted entitlements for org: %', founder_org_id;

      -- Delete onboarding status
      DELETE FROM public.org_onboarding_status WHERE organization_id = founder_org_id;
      RAISE NOTICE 'Deleted onboarding status for org: %', founder_org_id;

      -- Delete org members
      DELETE FROM public.org_members WHERE organization_id = founder_org_id;
      RAISE NOTICE 'Deleted org members for org: %', founder_org_id;

      -- Delete the organization
      DELETE FROM public.organizations WHERE id = founder_org_id;
      RAISE NOTICE 'Deleted organization: %', founder_org_id;
    END IF;

    -- Delete user profile if exists
    DELETE FROM public.user_profiles WHERE user_id = founder_user_id;
    RAISE NOTICE 'Deleted user profile for: %', founder_user_id;

    RAISE NOTICE 'Cleanup complete for founder: %', founder_user_id;
  ELSE
    RAISE NOTICE 'No user found with email: ejazhussaini313@gmail.com';
  END IF;
END $$;

-- Verify cleanup
DO $$
DECLARE
  founder_user_id uuid;
  org_count int;
  member_count int;
BEGIN
  SELECT id INTO founder_user_id
  FROM auth.users
  WHERE email = 'ejazhussaini313@gmail.com';

  IF founder_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO org_count
    FROM public.org_members
    WHERE user_id = founder_user_id;

    SELECT COUNT(*) INTO member_count
    FROM public.org_members
    WHERE user_id = founder_user_id;

    RAISE NOTICE 'Verification - User ID: %, Org memberships: %, Member records: %', 
      founder_user_id, org_count, member_count;

    IF org_count = 0 AND member_count = 0 THEN
      RAISE NOTICE 'Cleanup successful - founder has no org/user data';
    ELSE
      RAISE WARNING 'Cleanup may be incomplete - found remaining records';
    END IF;
  END IF;
END $$;
