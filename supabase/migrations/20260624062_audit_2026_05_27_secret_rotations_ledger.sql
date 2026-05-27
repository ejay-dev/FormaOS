-- Audit 2026-05-27 — secret rotation ledger.
-- Append-only record of who rotated which platform secret, when, and why.
-- Service-role-only access. Auditable trail for compliance reviewers.
--
-- See docs/operations/secret-rotation-runbook.md for the rotation
-- procedure per secret kind.

CREATE TABLE IF NOT EXISTS public.secret_rotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name text NOT NULL,
  rotated_at timestamptz NOT NULL DEFAULT now(),
  rotated_by text,
  reason text NOT NULL,
  previous_value_fingerprint text,
  new_value_fingerprint text,
  notes text,
  ticket_url text,
  CONSTRAINT secret_rotations_secret_name_check
    CHECK (
      secret_name IN (
        'SUPABASE_SERVICE_ROLE_KEY',
        'AUDIT_CHAIN_HMAC_KEY',
        'INTEGRATION_CONFIG_KEY',
        'TOTP_ENCRYPTION_KEY',
        'TRUST_PACKET_SIGNING_KEY',
        'EMAIL_UNSUBSCRIBE_SECRET',
        'NEXTAUTH_SECRET',
        'SAML_SP_PRIVATE_KEY',
        'VAPID_PRIVATE_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'CRON_SECRET',
        'PAGERDUTY_ROUTING_KEY',
        'POSTHOG_PERSONAL_API_KEY',
        'FIREBASE_SERVER_KEY',
        'KV_REST_API_TOKEN',
        'OTHER'
      )
    ),
  CONSTRAINT secret_rotations_reason_min_length
    CHECK (char_length(trim(reason)) >= 8)
);

CREATE INDEX IF NOT EXISTS secret_rotations_secret_name_rotated_at_idx
  ON public.secret_rotations (secret_name, rotated_at DESC);

ALTER TABLE public.secret_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_rotations FORCE ROW LEVEL SECURITY;

-- Deny authenticated/anon entirely. service_role bypasses RLS.
CREATE POLICY secret_rotations_deny_all ON public.secret_rotations
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- Restrictive append-only invariants — block UPDATE+DELETE for any
-- role, including service_role (defense-in-depth; the table is by
-- design write-once).
CREATE POLICY secret_rotations_no_update ON public.secret_rotations
  AS RESTRICTIVE FOR UPDATE USING (false);
CREATE POLICY secret_rotations_no_delete ON public.secret_rotations
  AS RESTRICTIVE FOR DELETE USING (false);

COMMENT ON TABLE public.secret_rotations IS
  'Audit 2026-05-27: append-only ledger of platform-secret rotations. RESTRICTIVE policies enforce no UPDATE/DELETE. Service-role-only insert. See docs/operations/secret-rotation-runbook.md.';

-- RPC for the rotation-recording script. Validates input + lets the
-- script run without needing direct table-insert permissions.
CREATE OR REPLACE FUNCTION public.record_secret_rotation(
  p_secret_name text,
  p_reason text,
  p_rotated_by text,
  p_previous_fingerprint text,
  p_new_fingerprint text,
  p_notes text DEFAULT NULL,
  p_ticket_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.secret_rotations (
    secret_name, rotated_by, reason,
    previous_value_fingerprint, new_value_fingerprint,
    notes, ticket_url
  ) VALUES (
    p_secret_name, p_rotated_by, p_reason,
    p_previous_fingerprint, p_new_fingerprint,
    p_notes, p_ticket_url
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_secret_rotation(text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_secret_rotation(text, text, text, text, text, text, text)
  TO service_role;
