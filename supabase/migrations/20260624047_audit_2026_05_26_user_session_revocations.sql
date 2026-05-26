-- Audit 2026-05-26 — P0-13: per-user JWT-iat watermark for session revocation.
--
-- Background: admin role downgrades and org-membership removals didn't
-- invalidate active sessions. A demoted admin's JWT (issued before
-- the change) stayed valid until Supabase's refresh cycle (~1h), so
-- they could continue using the admin console on in-flight tabs.
--
-- Fix: record a per-user `revoked_at` timestamp in this table. Auth
-- helpers compare it against the access-token `iat` claim and reject
-- any JWT issued at or before that moment. Setting a new timestamp
-- invalidates every JWT minted prior to it — including the user's
-- own current tab — forcing a Supabase refresh (which then re-reads
-- the user's current roles/memberships).
--
-- Table is service-role-only at the RLS layer: only the server-side
-- code path that calls revokeAllSessions / assertSessionNotRevoked
-- can read or write it. End-user clients have no business knowing
-- when their own session was revoked — they'll just be re-prompted
-- to sign in.

CREATE TABLE IF NOT EXISTS public.user_session_revocations (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked_at  timestamptz NOT NULL DEFAULT now(),
  revoked_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_session_revocations_revoked_at
  ON public.user_session_revocations (revoked_at DESC);

ALTER TABLE public.user_session_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_session_revocations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_session_revocations_service_only
  ON public.user_session_revocations;

CREATE POLICY user_session_revocations_service_only
  ON public.user_session_revocations
  AS PERMISSIVE
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.user_session_revocations IS
  'P0-13: per-user JWT-iat watermark. assertSessionNotRevoked rejects any '
  'access token whose iat predates revoked_at, forcing the user to refresh '
  '— which re-reads current role + membership state from the DB. Written '
  'by the admin session_revoke endpoint and on role/membership downgrades.';
