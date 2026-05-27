-- Audit 2026-05-27 — Dormant user candidates view lockdown.
--
-- Closes two Supabase advisor ERRORs introduced by migration
-- 20260624063 (dormant_user_review):
--
--   * auth_users_exposed       — view joins auth.users and was reachable
--                                by anon/authenticated via PostgREST.
--   * security_definer_view    — view defaulted to SECURITY DEFINER
--                                semantics (no security_invoker option set).
--
-- Fix shape:
--   1. Flip the view to security_invoker=true so it runs with the caller's
--      privileges, not the view-creator's. Anon/authenticated lack SELECT
--      on auth.users, so even if PostgREST exposes the route, the underlying
--      query fails authorization.
--   2. Revoke all grants on the view from PUBLIC, anon, authenticated.
--      The only consumer is public.snapshot_dormant_users() — a SECURITY
--      DEFINER RPC that already executes as the function-owner and is
--      itself granted only to service_role (see migration 20260624063
--      lines 118-120).
--
-- After this migration the view is consumed exclusively by the
-- service-role RPC path; PostgREST anon/auth callers get 403.

ALTER VIEW public.dormant_user_candidates SET (security_invoker = true);

REVOKE ALL ON public.dormant_user_candidates FROM PUBLIC;
REVOKE ALL ON public.dormant_user_candidates FROM anon;
REVOKE ALL ON public.dormant_user_candidates FROM authenticated;
GRANT SELECT ON public.dormant_user_candidates TO service_role;

COMMENT ON VIEW public.dormant_user_candidates IS
  'Audit 2026-05-27: confirmed users with no active org membership and >730 days of inactivity, excluded if already in user_purge_jobs. Consumed exclusively by public.snapshot_dormant_users() (service_role only). security_invoker=true so anon/auth cannot bypass auth.users RLS via this view.';
