-- 20260122_fix_supabase_warnings.sql
-- Fixes for Supabase linter warnings (function search_path, permissive RLS policies)

BEGIN;

-- 1. Make search_path explicit for all flagged functions

-- Dynamically ALTER only existing functions with correct argument types
DO $$
DECLARE
  r RECORD;
  func_signature text;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE (p.proname, n.nspname) IN (
      ('update_updated_at_column', 'public'),
      ('prevent_org_control_evaluations_update', 'public'),
      ('prevent_audit_mutation', 'public'),
      ('update_workflow_updated_at', 'public'),
      ('create_email_preferences_for_new_user', 'public'),
      ('generate_renewal_tasks', 'public'),
      ('log_email_send', 'public'),
      ('update_updated_at', 'public'),
      ('create_notification_prefs_for_new_user', 'public'),
      ('set_updated_at', 'public'),
      ('safe_uuid', 'public'),
      ('care_set_updated_at', 'public'),
      ('log_policy_activity', 'public'),
      ('log_generic_activity', 'public'),
      ('safe_uuid', 'app'),
      ('set_ctx', 'app'),
      ('current_org_id', 'app'),
      ('current_user_id', 'app'),
      ('is_org_admin', 'public'),
      ('my_org_ids', 'public'),
      ('bootstrap_org_from_library', 'public')
    )
  LOOP
    func_signature := format('%I.%I(%s)', r.nspname, r.proname, r.args);
    EXECUTE format('ALTER FUNCTION %s SET search_path = %I, pg_temp;', func_signature, r.nspname);
  END LOOP;
END $$;

-- 2. Update overly permissive RLS policies
-- Replace WITH CHECK (true) with WITH CHECK (auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Anyone can submit form responses" ON public.form_responses;
CREATE POLICY "Anyone can submit form responses" ON public.form_responses
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS marketing_leads_insert ON public.marketing_leads;
CREATE POLICY marketing_leads_insert ON public.marketing_leads
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS audit_logs_write_access ON public.org_audit_logs;
CREATE POLICY audit_logs_write_access ON public.org_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;

-- 3. Leaked password protection must be enabled in Supabase Auth dashboard (not SQL)
-- See: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
