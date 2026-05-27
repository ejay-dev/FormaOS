-- Audit 2026-05-27 (Tier 3.3) — SECURITY DEFINER allowlist trim batch.
--
-- Pre-batch: 14 functions in scripts/.security-definer-rpc-allowlist.json.
-- This migration revokes EXECUTE from anon (and authenticated where safe)
-- for 6 functions whose call paths only go through service_role.
--
-- Verification trail (call-site audit, audit 2026-05-27):
--
--   cleanup_old_security_data        cron only (api/cron/security-retention)
--                                    → admin.rpc → service_role
--                                    → REVOKE anon, authenticated.
--
--   claim_compliance_export_jobs     cron only (api/cron/compliance-exports)
--                                    → admin.rpc → service_role
--                                    → REVOKE anon, authenticated.
--
--   claim_enterprise_export_jobs     cron only (api/cron/enterprise-exports)
--                                    → admin.rpc → service_role
--                                    → REVOKE anon, authenticated.
--
--   claim_report_export_jobs         cron only (api/cron/report-exports)
--                                    → admin.rpc → service_role
--                                    → REVOKE anon, authenticated.
--
--   update_session_heartbeat         user-session only (app/auth/signout)
--                                    → supabase.rpc with authenticated session
--                                    → REVOKE anon. Keep authenticated.
--
--   log_email_send                   server-action only (lib/email/email-log-compat.ts)
--                                    → supabase.rpc with authenticated session
--                                    → REVOKE anon. Keep authenticated.
--
-- The remaining 8 functions (accept_invite, bootstrap_org_from_library,
-- create_invite, create_org, create_security_alert, current_user_*_org_ids,
-- search_embeddings) need a separate audit pass — they're either tied to
-- session-bootstrap timing (anon callable by design) or have unclear
-- caller paths that warrant individual investigation before lockdown.

REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_data() TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_compliance_export_jobs(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_compliance_export_jobs(integer, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_enterprise_export_jobs(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_enterprise_export_jobs(integer, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_report_export_jobs(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_report_export_jobs(integer, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_session_heartbeat(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_session_heartbeat(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_heartbeat(text, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_email_send(
  text, text, text, text, text, text, jsonb, uuid, uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_email_send(
  text, text, text, text, text, text, jsonb, uuid, uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_email_send(
  text, text, text, text, text, text, jsonb, uuid, uuid
) TO service_role;
