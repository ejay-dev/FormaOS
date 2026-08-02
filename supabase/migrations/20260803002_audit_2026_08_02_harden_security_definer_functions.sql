-- Audit 2026-08-02 — harden SECURITY DEFINER functions that accept a tenant id
-- (or a user id) as a parameter and never check the caller.
--
-- ENGINEERING_CHANGE_MATRIX already requires that every SECURITY DEFINER
-- function explicitly REVOKE EXECUTE FROM PUBLIC/anon/authenticated, because
-- Postgres grants EXECUTE to PUBLIC by default. These five were missed. Note
-- that revoking from `anon` and `authenticated` alone is not sufficient — the
-- default PUBLIC grant (shown as `=X/postgres` in proacl) must also go, or the
-- roles inherit EXECUTE through PUBLIC anyway.
--
-- Caller-identity model used below: after the PUBLIC/anon revokes, a NULL
-- auth.uid() can only mean a service_role connection (trusted server-side
-- code), because anon can no longer reach these functions at all. So each
-- guard enforces membership only when auth.uid() IS NOT NULL, which keeps
-- server-side callers working unchanged while blocking end users from acting
-- on tenants they do not belong to.
--
-- search_path is already pinned on all five; left as-is.

BEGIN;

-- ---------------------------------------------------------------------------
-- search_embeddings — took any p_org_id and returned that tenant's indexed
-- document text with no caller check, EXECUTE-able by anon. Currently latent
-- only because ai_document_embeddings is empty; it becomes a cross-tenant leak
-- the day the AI feature carries data.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_embeddings(
  p_org_id uuid,
  p_query_embedding extensions.vector,
  p_source_types text[] DEFAULT NULL::text[],
  p_limit integer DEFAULT 10,
  p_similarity_threshold double precision DEFAULT 0.7
)
RETURNS TABLE (
  id uuid, source_type text, source_id uuid, chunk_index integer,
  chunk_text text, metadata jsonb, similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.org_members m
       WHERE m.organization_id = p_org_id AND m.user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'search_embeddings: caller is not a member of organization %', p_org_id
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT e.id, e.source_type, e.source_id, e.chunk_index, e.chunk_text, e.metadata,
         1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM ai_document_embeddings e
  WHERE e.org_id = p_org_id
    AND (p_source_types IS NULL OR e.source_type = ANY(p_source_types))
    AND 1 - (e.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_embeddings(uuid, extensions.vector, text[], integer, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_embeddings(uuid, extensions.vector, text[], integer, double precision) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- update_session_heartbeat — any signed-in user could refresh or create an
-- active_sessions row for ANY user id, which both pollutes the security
-- surface and can keep another user's session looking alive.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_session_heartbeat(
  p_session_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'update_session_heartbeat: cannot write a heartbeat for another user'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.active_sessions
  SET last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.active_sessions (session_id, user_id)
    VALUES (p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_session_heartbeat(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_session_heartbeat(text, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- log_email_send — any signed-in user could forge an email-log row against any
-- organisation or user id. Still called by app code through the cookie-bound
-- server client (lib/email/email-log-compat.ts), so `authenticated` keeps
-- EXECUTE and the guard constrains the arguments instead.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_email_send(
  p_email_type text, p_recipient_email text, p_subject text,
  p_status text DEFAULT 'sent'::text,
  p_resend_id text DEFAULT NULL::text,
  p_error_message text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_organization_id uuid DEFAULT NULL::uuid,
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_log_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF p_organization_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.org_members m
         WHERE m.organization_id = p_organization_id AND m.user_id = auth.uid()
       )
    THEN
      RAISE EXCEPTION 'log_email_send: caller is not a member of organization %', p_organization_id
        USING ERRCODE = '42501';
    END IF;

    IF p_user_id IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'log_email_send: cannot attribute an email log to another user'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO email_logs (
    email_type, recipient_email, subject, status, resend_id,
    error_message, metadata, organization_id, user_id
  ) VALUES (
    p_email_type, p_recipient_email, p_subject, p_status, p_resend_id,
    p_error_message, p_metadata, p_organization_id, p_user_id
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_email_send(text, text, text, text, text, text, jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_email_send(text, text, text, text, text, text, jsonb, uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- bootstrap_org_from_library and create_security_alert have zero call sites in
-- the application and no caller check at all. Rather than add a guard to code
-- nothing invokes, restrict them to service_role so any future use has to be
-- deliberate and server-side.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.bootstrap_org_from_library(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_org_from_library(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.create_security_alert(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_security_alert(uuid, text) TO service_role;

-- Note: current_user_org_ids() and current_user_admin_org_ids() are deliberately
-- left executable by anon and authenticated. Both are evaluated inside RLS
-- policies by the querying role, so revoking EXECUTE would turn every policy
-- that calls them into a hard error instead of an empty result. Neither leaks:
-- each returns only the caller's own organisations, derived from auth.uid().

COMMIT;
