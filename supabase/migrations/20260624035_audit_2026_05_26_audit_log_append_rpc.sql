-- Audit 2026-05-26 — atomic audit_log append via RPC.
--
-- Background (Database C3 + M17): writeAuditLog reads last entry,
-- computes prev_hash + sequence_number + entry_hash, inserts. Two
-- writers can read the same lastEntry snapshot and both compute the
-- same (seq+1, prev_hash) — the loser hits the UNIQUE constraint and
-- retries. Up to 5 retries; under sustained contention (compliance
-- rerun across 150+ controls) the budget can be exhausted and the
-- audit event is dropped — a critical-data-loss bug for a tamper-
-- evident chain.
--
-- Fix: a single server-side RPC that:
--   1. Acquires pg_advisory_xact_lock keyed by org_id (serialises
--      chain writers for the same org for the lifetime of the tx).
--   2. Reads the last row for that org UNDER the lock.
--   3. Computes prev_hash + sequence_number + entry_hash atomically.
--   4. Inserts the row.
--
-- entry_hash format is versioned via a new `hash_algo` column:
--   * 'v1'  — legacy JS-side hash (insertion-order JSON, omits
--             undefined keys). Existing rows.
--   * 'v2'  — server-side hash (canonical JSON with explicit nulls
--             for missing optional fields). New rows from this RPC.
-- verifyChainIntegrity in JS chooses the algorithm per row.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: hash_algo column. Default 'v1' so legacy rows are
-- annotated correctly.
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS hash_algo text NOT NULL DEFAULT 'v1';

-- Step 2: canonical hash function. Builds JSON in a fixed order with
-- explicit nulls for missing optional fields, then SHA-256-hex. The
-- JS side produces an equivalent string for hash_algo='v2'.
CREATE OR REPLACE FUNCTION public._audit_log_compute_hash_v2(
  p_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_details jsonb,
  p_created_at timestamptz,
  p_prev_hash text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  canonical text;
BEGIN
  -- Use json_build_object (preserves argument order) not jsonb_*
  -- so the serialisation matches a JS object literal exactly.
  canonical := json_build_object(
    'id',            p_id::text,
    'org_id',        p_org_id::text,
    'user_id',       p_user_id::text,
    'action',        p_action,
    'resource_type', p_resource_type,
    'resource_id',   CASE WHEN p_resource_id IS NULL THEN NULL ELSE p_resource_id::text END,
    'details',       COALESCE(p_details, '{}'::jsonb),
    'created_at',    to_char(p_created_at AT TIME ZONE 'UTC',
                             'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'prev_hash',     COALESCE(p_prev_hash, '')
  )::text;

  RETURN encode(digest(canonical, 'sha256'), 'hex');
END;
$$;

-- Step 3: append RPC. Writes are gated by an advisory lock keyed by
-- org_id, releases on transaction commit. Returns the assembled chain
-- fields so the caller can report them or surface in logs.
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prev_hash text;
  v_prev_seq bigint;
  v_next_seq bigint;
  v_entry_hash text;
  v_created_at timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_log:' || p_org_id::text));

  SELECT al.entry_hash, al.sequence_number
    INTO v_prev_hash, v_prev_seq
    FROM public.audit_log al
   WHERE al.org_id = p_org_id
   ORDER BY al.sequence_number DESC NULLS LAST
   LIMIT 1;

  v_prev_hash := COALESCE(v_prev_hash, '');
  v_next_seq := COALESCE(v_prev_seq, 0) + 1;
  v_created_at := COALESCE(p_created_at, now());

  v_entry_hash := public._audit_log_compute_hash_v2(
    p_id,
    p_org_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    v_created_at,
    v_prev_hash
  );

  INSERT INTO public.audit_log (
    id, org_id, user_id, action, resource_type, resource_id,
    details, ip_address, user_agent, created_at,
    entry_hash, prev_hash, sequence_number, hash_algo
  ) VALUES (
    p_id, p_org_id, p_user_id, p_action, p_resource_type, p_resource_id,
    COALESCE(p_details, '{}'::jsonb), p_ip_address, p_user_agent, v_created_at,
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
