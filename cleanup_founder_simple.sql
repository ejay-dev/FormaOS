-- Simple Founder Cleanup - Remove user from organization only
-- This is a safer approach that avoids trigger issues

DO $$
DECLARE
  founder_user_id uuid;
  founder_org_id uuid;
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
      RAISE NOTICE 'Clearing founder membership from organization...';

      -- Just remove the membership - don't delete the organization
      DELETE FROM public.org_members 
      WHERE user_id = founder_user_id 
        AND organization_id = founder_org_id;

      RAISE NOTICE 'Founder removed from organization';
      RAISE NOTICE 'User can now log in as admin without user/data conflicts';
    ELSE
      RAISE NOTICE 'Founder has no organization membership - should work correctly';
    END IF;

    -- Delete user profile if exists
    DELETE FROM public.user_profiles WHERE user_id = founder_user_id;
    RAISE NOTICE 'Deleted user profile for: %', founder_user_id;

    RAISE NOTICE 'Cleanup complete';
  ELSE
    RAISE NOTICE 'No user found with email: ejazhussaini313@gmail.com';
  END IF;
END $$;

-- Verify
DO $$
DECLARE
  founder_user_id uuid;
  membership_count int;
BEGIN
  SELECT id INTO founder_user_id
  FROM auth.users
  WHERE email = 'ejazhussaini313@gmail.com';

  IF founder_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO membership_count
    FROM public.org_members
    WHERE user_id = founder_user_id;

    RAISE NOTICE 'Verification - User ID: %, Memberships remaining: %', 
      founder_user_id, membership_count;

    IF membership_count = 0 THEN
      RAISE NOTICE 'SUCCESS: Founder has no memberships - ready for admin login';
    ELSE
      RAISE WARNING 'Warning: Founder still has memberships';
    END IF;
  END IF;
END $$;

-- Note: The organization and audit logs remain but founder is no longer a member
-- This prevents the regular user flow from triggering for the founder
