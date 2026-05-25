-- Audit 2026-05-26 — create the user_preferences table that
-- lib/auth/membership-cache.ts, lib/multi-org.ts, and
-- lib/identity/org-access.ts have been reading/writing to for months
-- without a corresponding CREATE TABLE in this repo. Either the table
-- was created via the Supabase Dashboard SQL editor (not in source),
-- or the migration that added it was rolled back without removing
-- the lib call sites. Either way, this re-emits the schema as
-- IF NOT EXISTS so existing data is preserved.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- An index on current_organization_id helps when we want to clean up
-- preferences pointing at a deleted org (the FK already does this via
-- SET NULL, but a follow-up reconciliation cron will want to enumerate).
CREATE INDEX IF NOT EXISTS user_preferences_current_org_idx
  ON public.user_preferences (current_organization_id)
  WHERE current_organization_id IS NOT NULL;

-- Keep updated_at honest.
CREATE OR REPLACE FUNCTION public._touch_user_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_preferences_set_updated_at
  ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public._touch_user_preferences_updated_at();

-- RLS — users see and modify only their own row. Service-role bypasses.
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_preferences_self_select ON public.user_preferences;
CREATE POLICY user_preferences_self_select
  ON public.user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_self_insert ON public.user_preferences;
CREATE POLICY user_preferences_self_insert
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_self_update ON public.user_preferences;
CREATE POLICY user_preferences_self_update
  ON public.user_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_self_delete ON public.user_preferences;
CREATE POLICY user_preferences_self_delete
  ON public.user_preferences
  FOR DELETE
  USING (user_id = auth.uid());
