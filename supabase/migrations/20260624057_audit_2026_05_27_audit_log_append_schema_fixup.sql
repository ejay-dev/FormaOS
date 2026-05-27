-- Audit 2026-05-27 — fix the audit_log_append RPC introduced in 20260624035.
-- Two latent bugs surfaced when the R5 trigger (20260624055) tried to call it:
--
--   1. search_path missed `extensions` schema, so the pgcrypto `digest()`
--      function failed at hash-compute time. Result: the entire R5 transition
--      trigger was silently no-op'd via its exception handler.
--
--   2. The INSERT only filled the legacy `action/resource_type/details`
--      column set; the prod schema also has NOT NULL `event_type` and
--      `target_type` columns (newer convention used by lib/admin/audit.ts).
--      Result: every call to audit_log_append failed the NOT NULL constraint,
--      so the v2 hash chain has 0 rows on prod despite ~6 weeks of writes.
--
-- Fix: rewrite the RPC to fill BOTH column sets (legacy + new) and include
-- extensions in search_path. The existing pre-2026-05-26 v1 rows remain
-- untouched and continue to verify under their own algorithm.
--
-- Sequence_number is shared across both column sets — a row that's "in the
-- chain" is identified by entry_hash IS NOT NULL.

ALTER FUNCTION public._audit_log_compute_hash_v2(uuid, uuid, uuid, text, text, uuid, jsonb, timestamptz, text)
  SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.audit_log_append(
  p_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_details jsonb,
  p_ip_address text,
  p_user_agent text,
  p_created_at timestamptz
)
RETURNS TABLE (
  id uuid,
  sequence_number bigint,
  prev_hash text,
  entry_hash text,
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
  v_created_at timestamptz;
  v_details jsonb;
BEGIN
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

  v_entry_hash := public._audit_log_compute_hash_v2(
    p_id,
    p_org_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    v_details,
    v_created_at,
    v_prev_hash
  );

  -- Fill BOTH the legacy (action/resource_type/details) and new
  -- (event_type/target_type/metadata) column sets so the row satisfies
  -- the NOT NULL constraints from both schema generations.
  INSERT INTO public.audit_log (
    id, org_id, user_id,
    action, resource_type, resource_id, details,
    event_type, target_type, target_id, metadata,
    environment,
    ip_address, user_agent, created_at,
    entry_hash, prev_hash, sequence_number, hash_algo
  ) VALUES (
    p_id, p_org_id, p_user_id,
    p_action, p_resource_type, p_resource_id, v_details,
    p_action, p_resource_type, COALESCE(p_resource_id::text, ''), v_details,
    COALESCE(current_setting('app.environment', true), 'production'),
    p_ip_address, p_user_agent, v_created_at,
    v_entry_hash, v_prev_hash, v_next_seq, 'v2'
  );

  RETURN QUERY SELECT p_id, v_next_seq, v_prev_hash, v_entry_hash, 'v2'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_log_append(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.audit_log_append(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz
) TO service_role;

-- Companion: harden org_evidence.file_hash to NOT NULL. After the
-- 2026-05-27 R9 backfill + 128-row demo-org cleanup, every remaining
-- row has a hash. Going forward, the SHA-256 capture step at upload
-- (lib/evidence/verify-file-hash.ts:computeFileSha256) is the contract
-- — there is no legitimate code path that creates an evidence row
-- without a hash, so enforce it at the column level.
ALTER TABLE public.org_evidence
  ALTER COLUMN file_hash SET NOT NULL;
