-- Audit 2026-05-27 (R3) — keyed HMAC audit chain.
--
-- Background: the existing audit_log chain uses unkeyed SHA-256 (v1/v2).
-- A motivated insider with service_role + an off-hours window could rewrite
-- the chain end-to-end (rehash every row in sequence) and nothing in the
-- chain itself would betray the rewrite. R3 introduces a per-org HMAC key
-- so a rewrite now requires both DB write access AND the key.
--
-- Architecture:
--   1. audit_chain_secrets — one row per org, holds an AES-GCM-encrypted
--      32-byte HMAC key. Service-role-only read; written via the lib-side
--      key-bootstrap on first audit write per org.
--   2. audit_log.entry_mac — new nullable column. v1/v2 rows have NULL
--      (verifier falls back to plain SHA-256). v3-hmac rows carry the HMAC.
--   3. audit_log_append_v3 RPC — takes the raw HMAC key as a parameter
--      (resolved + decrypted in Node, transmitted over TLS), computes both
--      entry_hash (v2 algo, kept for backwards compat) AND entry_mac
--      (HMAC-SHA-256 over the same canonical payload).
--   4. audit_chain_anchors — empty hooks table for the external-anchor
--      work (Sigstore Rekor or similar). One row per anchor event.

-- 1. Key storage. Encrypted-at-rest using the AUDIT_CHAIN_HMAC_KEY envelope
--    in Node land (lib/audit/chain-secret-manager.ts). The DB never sees
--    the plaintext key in this table — only the envelope.
CREATE TABLE IF NOT EXISTS public.audit_chain_secrets (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  encrypted_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  algorithm text NOT NULL DEFAULT 'hmac-sha256',
  CONSTRAINT audit_chain_secrets_algorithm_check
    CHECK (algorithm IN ('hmac-sha256'))
);

ALTER TABLE public.audit_chain_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain_secrets FORCE ROW LEVEL SECURITY;

-- Deny everything to authenticated/anon. Service role bypasses RLS.
-- Restrictive policies prevent UPDATE+DELETE even with future relax.
CREATE POLICY audit_chain_secrets_deny_all
  ON public.audit_chain_secrets
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY audit_chain_secrets_no_update
  ON public.audit_chain_secrets
  AS RESTRICTIVE
  FOR UPDATE
  USING (false);

-- DELETE is allowed via the org-delete CASCADE FK only; no policy.

COMMENT ON TABLE public.audit_chain_secrets IS
  'R3 (2026-05-27): per-org HMAC keys for the v3-hmac audit chain. encrypted_key is an AES-256-GCM envelope produced by lib/audit/chain-secret-manager.ts using the AUDIT_CHAIN_HMAC_KEY env-var as the wrapping key. Service-role-only read.';

-- 2. New column on audit_log + hash_algo accepts 'v3-hmac'.
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS entry_mac text;

COMMENT ON COLUMN public.audit_log.entry_mac IS
  'R3 (2026-05-27): HMAC-SHA-256 over the canonical JSON, keyed with the per-org secret from audit_chain_secrets. NULL for v1/v2 rows. Set for hash_algo=v3-hmac rows.';

-- 3. The v3-hmac append RPC. Signature mirrors audit_log_append plus a
--    raw HMAC key parameter (32-byte hex string). RPC trusts the caller
--    (service_role only) to have decrypted the key correctly.
CREATE OR REPLACE FUNCTION public.audit_log_append_v3(
  p_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_details jsonb,
  p_ip_address text,
  p_user_agent text,
  p_created_at timestamptz,
  p_hmac_key bytea
)
RETURNS TABLE (
  id uuid,
  sequence_number bigint,
  prev_hash text,
  entry_hash text,
  entry_mac text,
  hash_algo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_prev_hash text;
  v_prev_seq bigint;
  v_next_seq bigint;
  v_entry_hash text;
  v_entry_mac text;
  v_created_at timestamptz;
  v_details jsonb;
  v_canonical text;
BEGIN
  IF p_hmac_key IS NULL OR octet_length(p_hmac_key) <> 32 THEN
    RAISE EXCEPTION 'audit_log_append_v3 requires a 32-byte HMAC key (got %)',
      COALESCE(octet_length(p_hmac_key)::text, 'NULL');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('audit_log:' || COALESCE(p_org_id::text, '__global__')));

  SELECT al.entry_hash, al.sequence_number
    INTO v_prev_hash, v_prev_seq
    FROM public.audit_log al
   WHERE al.org_id IS NOT DISTINCT FROM p_org_id
     AND al.entry_hash IS NOT NULL
   ORDER BY al.sequence_number DESC NULLS LAST
   LIMIT 1;

  v_prev_hash := COALESCE(v_prev_hash, '');
  v_next_seq := COALESCE(v_prev_seq, 0) + 1;
  v_created_at := COALESCE(p_created_at, now());
  v_details := COALESCE(p_details, '{}'::jsonb);

  -- v2 canonical payload (same algorithm as audit_log_append) — kept so a
  -- v3 row can also be verified under v2 by setting `entry_mac` aside.
  v_canonical := json_build_object(
    'id',            p_id::text,
    'org_id',        p_org_id::text,
    'user_id',       p_user_id::text,
    'action',        p_action,
    'resource_type', p_resource_type,
    'resource_id',   CASE WHEN p_resource_id IS NULL THEN NULL ELSE p_resource_id::text END,
    'details',       v_details,
    'created_at',    to_char(v_created_at AT TIME ZONE 'UTC',
                             'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'prev_hash',     v_prev_hash
  )::text;

  -- Cast canonical text to bytea so extensions.hmac binds to
  -- (bytea, bytea, text) — the (text, text, text) overload would require
  -- the key as text, which loses the byte-exact key material.
  DECLARE v_canonical_bytes bytea := convert_to(v_canonical, 'UTF8'); BEGIN
    v_entry_hash := encode(extensions.digest(v_canonical_bytes, 'sha256'), 'hex');
    v_entry_mac  := encode(extensions.hmac(v_canonical_bytes, p_hmac_key, 'sha256'), 'hex');
  END;

  INSERT INTO public.audit_log (
    id, org_id, user_id,
    action, resource_type, resource_id, details,
    event_type, target_type, target_id, metadata,
    environment,
    ip_address, user_agent, created_at,
    entry_hash, entry_mac, prev_hash, sequence_number, hash_algo
  ) VALUES (
    p_id, p_org_id, p_user_id,
    p_action, p_resource_type, p_resource_id, v_details,
    p_action, p_resource_type, COALESCE(p_resource_id::text, ''), v_details,
    COALESCE(current_setting('app.environment', true), 'production'),
    p_ip_address, p_user_agent, v_created_at,
    v_entry_hash, v_entry_mac, v_prev_hash, v_next_seq, 'v3-hmac'
  );

  RETURN QUERY SELECT p_id, v_next_seq, v_prev_hash, v_entry_hash, v_entry_mac, 'v3-hmac'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_log_append_v3(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz, bytea
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.audit_log_append_v3(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz, bytea
) TO service_role;

COMMENT ON FUNCTION public.audit_log_append_v3 IS
  'R3 (2026-05-27): keyed HMAC audit-log append. Computes both entry_hash (v2 algorithm — kept so legacy verifiers still pass) and entry_mac (HMAC-SHA-256 keyed with the per-org secret). Caller must pass the raw 32-byte key as bytea; lib/audit/chain-secret-manager.ts handles decryption.';

-- 4. External-anchor hooks. Empty for now; cron job in a future migration
--    will write rows when the daily/weekly anchor lands in the external
--    transparency log (e.g., Sigstore Rekor).
CREATE TABLE IF NOT EXISTS public.audit_chain_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  anchored_at timestamptz NOT NULL DEFAULT now(),
  top_sequence_number bigint NOT NULL,
  top_entry_hash text NOT NULL,
  external_anchor_id text NOT NULL,
  external_provider text NOT NULL,
  external_anchor_url text,
  CONSTRAINT audit_chain_anchors_provider_check
    CHECK (external_provider IN ('sigstore-rekor', 'internal-test'))
);

CREATE INDEX IF NOT EXISTS audit_chain_anchors_org_anchored_at_idx
  ON public.audit_chain_anchors (org_id, anchored_at DESC);

CREATE INDEX IF NOT EXISTS audit_chain_anchors_top_hash_idx
  ON public.audit_chain_anchors (top_entry_hash);

ALTER TABLE public.audit_chain_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain_anchors FORCE ROW LEVEL SECURITY;

-- Org members can READ their own anchors (so customers can verify their
-- own audit posture in the UI). Writes go through service_role only.
CREATE POLICY audit_chain_anchors_select_org_members
  ON public.audit_chain_anchors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = audit_chain_anchors.org_id
         AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY audit_chain_anchors_no_update
  ON public.audit_chain_anchors
  AS RESTRICTIVE
  FOR UPDATE
  USING (false);

CREATE POLICY audit_chain_anchors_no_delete
  ON public.audit_chain_anchors
  AS RESTRICTIVE
  FOR DELETE
  USING (false);

COMMENT ON TABLE public.audit_chain_anchors IS
  'R3 + external anchor (2026-05-27): each row records a hash-chain top-entry submitted to an external transparency log (Sigstore Rekor, …). RESTRICTIVE policies enforce append-only. Org members can SELECT their own anchors; service_role writes.';
