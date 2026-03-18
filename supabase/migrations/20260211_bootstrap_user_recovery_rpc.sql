-- Ensure partial users can be repaired idempotently from server-side recovery flows.
-- This RPC is intentionally service-role only.

CREATE OR REPLACE FUNCTION public.rpc_bootstrap_user(
  p_user_id uuid,
  p_user_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_actions text[] := ARRAY[]::text[];
  v_now timestamptz := now();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  SELECT m.organization_id
  INTO v_org_id
  FROM public.org_members m
  WHERE m.user_id = p_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    v_org_name := concat(
      COALESCE(NULLIF(split_part(COALESCE(p_user_email, 'user'), '@', 1), ''), 'user'),
      '''s Organization'
    );

    INSERT INTO public.organizations (
      name,
      created_by,
      plan_key,
      plan_selected_at,
      onboarding_completed
    )
    VALUES (
      v_org_name,
      p_user_id,
      'basic',
      v_now,
      false
    )
    RETURNING id INTO v_org_id;

    v_actions := array_append(v_actions, 'org_created');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE organization_id = v_org_id
      AND user_id = p_user_id
  ) THEN
    INSERT INTO public.org_members (organization_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    v_actions := array_append(v_actions, 'membership_created');
  END IF;

  UPDATE public.org_members
  SET role = COALESCE(NULLIF(role, ''), 'member')
  WHERE organization_id = v_org_id
    AND user_id = p_user_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.org_onboarding_status
    WHERE organization_id = v_org_id
  ) THEN
    INSERT INTO public.org_onboarding_status (
      organization_id,
      current_step,
      completed_steps,
      updated_at
    )
    VALUES (
      v_org_id,
      1,
      ARRAY[]::integer[],
      v_now
    );
    v_actions := array_append(v_actions, 'onboarding_status_created');
  END IF;

  IF to_regclass('public.orgs') IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.orgs
    WHERE id = v_org_id
  ) THEN
    INSERT INTO public.orgs (id, name, created_by, created_at, updated_at)
    VALUES (v_org_id, COALESCE(v_org_name, 'Organization'), p_user_id, v_now, v_now);
    v_actions := array_append(v_actions, 'legacy_org_created');
  END IF;

  IF to_regclass('public.user_profiles') IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = p_user_id
  ) THEN
    INSERT INTO public.user_profiles (user_id, organization_id)
    VALUES (p_user_id, v_org_id);
    v_actions := array_append(v_actions, 'user_profile_created');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'organization_id', v_org_id,
    'actions', v_actions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_bootstrap_user(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_bootstrap_user(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_bootstrap_user(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_bootstrap_user(uuid, text) TO service_role;

