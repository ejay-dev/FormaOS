-- Safe replacement for create_notification_prefs_for_new_user
-- Run this in the Supabase SQL editor (or via psql as the service-role)

CREATE OR REPLACE FUNCTION public.create_notification_prefs_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    INSERT INTO public.org_notification_prefs (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'create_notification_prefs_for_new_user suppressed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
