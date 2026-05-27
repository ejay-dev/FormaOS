-- Audit 2026-05-27 — Supabase security advisor hygiene batch.
-- Closes three WARN clusters surfaced by the advisor:
--   1. 5 SECURITY DEFINER trigger handlers callable as RPC by anon/auth.
--   2. api_key_usage_log INSERT policy with WITH CHECK (true) — open to
--      any authenticated user via PostgREST.
--   3. 11 functions without a fixed search_path.
--
-- None of these are net-new this audit cycle; they're pre-existing drift
-- documented in the SECDEF allowlist `_cleanup_notes`. Closing them now
-- so the next senior reviewer sees a cleaner advisor output (~40 WARN
-- post-fix vs ~59 pre-fix).

-- =========================================================================
-- 1. Trigger handlers — REVOKE EXECUTE from anon, authenticated, PUBLIC.
--    These functions are invoked by triggers under the calling role's
--    SECURITY DEFINER context; they never need RPC exposure.
-- =========================================================================

REVOKE EXECUTE ON FUNCTION public._fos_revoke_api_keys_for_demoted_admin()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._fos_revoke_api_keys_for_removed_member()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._touch_user_preferences_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.org_care_plans_snapshot_version()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile_from_org_member()
  FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- 2. api_key_usage_log INSERT — drop the open policy.
--    The legitimate writer (lib/api-keys/manager.ts:recordApiKeyUsage)
--    uses createSupabaseOrgClient → service_role under the hood, which
--    bypasses RLS. The open WITH CHECK (true) policy only enabled
--    anon/authenticated to POST padding rows via PostgREST — no
--    legitimate use.
-- =========================================================================

DROP POLICY IF EXISTS api_key_usage_log_service_insert ON public.api_key_usage_log;

COMMENT ON TABLE public.api_key_usage_log IS
  'API key usage log. INSERTs only via service_role (bypasses RLS). SELECT via org membership (existing policies). UPDATE/DELETE forbidden.';

-- =========================================================================
-- 3. function_search_path_mutable — set search_path on 11 functions.
--    Using `pg_catalog, public, pg_temp` as the canonical safe path.
--    pg_catalog first so built-ins (digest, hmac via pg_proc lookup,
--    etc.) are unambiguous regardless of caller's session search_path.
-- =========================================================================

ALTER FUNCTION public.set_mfa_required_on_role()                        SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_evidence_freshness(uuid)                   SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.find_or_create_master_control(text, text, text)   SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_security_alerts_updated_at()               SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.control_plane_prevent_audit_mutation()            SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_updated_at_column()                        SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.search_entities(uuid, text, text[], integer, integer) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_trust_packets_updated_at()                 SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.org_progress_notes_block_signed_updates()         SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.update_org_forms_updated_at()                     SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.control_plane_touch_updated_at()                  SET search_path = pg_catalog, public, pg_temp;
