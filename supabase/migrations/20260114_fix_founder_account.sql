-- Fix Founder Account: ejazhussaini313@gmail.com
-- Date: 2026-01-14
-- Purpose: Ensure founder has correct role and active subscription

-- 1️⃣ Get the user_id from auth.users
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Find the founder's user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'ejazhussaini313@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found with email: ejazhussaini313@gmail.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user_id: %', v_user_id;

  -- Get the user's organization
  SELECT organization_id INTO v_org_id
  FROM public.org_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found for user';
    RETURN;
  END IF;

  RAISE NOTICE 'Found organization_id: %', v_org_id;

  -- 2️⃣ Update org_members to ensure founder has 'owner' role
  UPDATE public.org_members
  SET role = 'owner'
  WHERE user_id = v_user_id
    AND role != 'owner';

  IF FOUND THEN
    RAISE NOTICE 'Updated role to owner for user in org_members';
  ELSE
    RAISE NOTICE 'Role already set to owner or no update needed';
  END IF;

  -- 3️⃣ Update organization to set pro plan
  UPDATE public.organizations
  SET 
    plan_key = 'pro',
    updated_at = now()
  WHERE id = v_org_id
    AND (plan_key IS NULL OR plan_key != 'pro');

  IF FOUND THEN
    RAISE NOTICE 'Updated organization plan_key to pro';
  END IF;

  -- 4️⃣ Ensure active subscription exists
  INSERT INTO public.org_subscriptions (
    organization_id,
    plan_key,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id,
    'pro',
    'active',
    now(),
    now()
  )
  ON CONFLICT (organization_id) 
  DO UPDATE SET
    plan_key = 'pro',
    status = 'active',
    updated_at = now();

  RAISE NOTICE 'Ensured active subscription for organization';

  -- 5️⃣ Ensure entitlements for pro plan
  INSERT INTO public.org_entitlements (
    organization_id,
    feature_key,
    enabled,
    limit_value,
    created_at,
    updated_at
  )
  VALUES 
    (v_org_id, 'audit_export', true, NULL, now(), now()),
    (v_org_id, 'reports', true, NULL, now(), now()),
    (v_org_id, 'framework_evaluations', true, NULL, now(), now()),
    (v_org_id, 'certifications', true, NULL, now(), now()),
    (v_org_id, 'team_limit', true, 75, now(), now())
  ON CONFLICT (organization_id, feature_key) 
  DO UPDATE SET
    enabled = true,
    updated_at = now();

  RAISE NOTICE 'Ensured entitlements for pro plan';

END $$;

-- 6️⃣ Create a function to ensure founder role on login
CREATE OR REPLACE FUNCTION public.ensure_founder_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the founder email
  IF NEW.email = 'ejazhussaini313@gmail.com' THEN
    -- Update role to owner for this user in all their org memberships
    UPDATE public.org_members
    SET role = 'owner'
    WHERE user_id = NEW.id
      AND role != 'owner';
    
    IF FOUND THEN
      RAISE NOTICE 'Ensured founder role for user: %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7️⃣ Create trigger to run on auth.users updates (e.g., Google login)
DROP TRIGGER IF EXISTS ensure_founder_role_trigger ON auth.users;
CREATE TRIGGER ensure_founder_role_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_founder_role();

-- 8️⃣ Add comment for documentation
COMMENT ON FUNCTION public.ensure_founder_role() IS 
  'Automatically ensures founder email gets owner role on login/signup';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Founder account fixed and protection added';
  RAISE NOTICE '   - Role set to owner';
  RAISE NOTICE '   - Plan set to pro';
  RAISE NOTICE '   - Subscription set to active';
  RAISE NOTICE '   - Entitlements configured';
  RAISE NOTICE '   - Auto-role trigger installed';
END $$;
