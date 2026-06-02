


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."member_status" AS ENUM (
    'active',
    'invited',
    'suspended'
);


ALTER TYPE "public"."member_status" OWNER TO "postgres";


CREATE TYPE "public"."org_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'worker',
    'auditor',
    'read_only',
    'staff'
);


ALTER TYPE "public"."org_role" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'past_due',
    'canceled',
    'pending_checkout',
    'incomplete'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_audit_log_compute_hash_v2"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_created_at" timestamp with time zone, "p_prev_hash" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
DECLARE
  canonical text;
BEGIN
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


ALTER FUNCTION "public"."_audit_log_compute_hash_v2"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_created_at" timestamp with time zone, "p_prev_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_audit_org_control_evaluation_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_action text;
  v_details jsonb;
  v_id_for_audit uuid;
  v_changed boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
    v_id_for_audit := OLD.id;
    v_action := 'control_evaluation_deleted';
    v_details := jsonb_build_object(
      'control_key', OLD.control_key,
      'old_status', OLD.status,
      'old_risk_level', OLD.details->>'riskLevel',
      'old_score', OLD.compliance_score
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed :=
      OLD.status IS DISTINCT FROM NEW.status
      OR (OLD.details->>'riskLevel') IS DISTINCT FROM (NEW.details->>'riskLevel')
      OR OLD.compliance_score IS DISTINCT FROM NEW.compliance_score
      OR OLD.satisfied_controls IS DISTINCT FROM NEW.satisfied_controls
      OR OLD.missing_controls IS DISTINCT FROM NEW.missing_controls;
    IF NOT v_changed THEN
      RETURN NULL;
    END IF;
    v_org_id := NEW.organization_id;
    v_id_for_audit := NEW.id;
    v_action := 'control_evaluation_updated';
    v_details := jsonb_build_object(
      'control_key', NEW.control_key,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_risk_level', OLD.details->>'riskLevel',
      'new_risk_level', NEW.details->>'riskLevel',
      'old_score', OLD.compliance_score,
      'new_score', NEW.compliance_score
    );
  ELSE
    RETURN NULL;
  END IF;
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;
  PERFORM public.audit_log_append(
    gen_random_uuid(),
    v_org_id,
    v_user_id,
    v_action,
    'org_control_evaluations',
    v_id_for_audit,
    v_details,
    NULL,
    NULL,
    now()
  );
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'audit_org_control_evaluation_change failed: %', SQLERRM;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."_audit_org_control_evaluation_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_audit_rls_status"() RETURNS TABLE("table_name" "text", "rls_enabled" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  SELECT c.relname::text, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY c.relname;
$$;


ALTER FUNCTION "public"."_audit_rls_status"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."_audit_rls_status"() IS 'Read-only RLS status reporter for the check-supabase-rls-contracts CI gate. SECURITY DEFINER + service_role-only EXECUTE so the gate works without granting broad pg_catalog access. Replaces the missing exec_sql() RPC the script previously depended on.';



CREATE OR REPLACE FUNCTION "public"."_fos_revoke_api_keys_for_demoted_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  -- We only care about role transitions OUT of admin/owner. New rows are
  -- handled by org_members.delete (covered by the second trigger) or
  -- org_members.insert (no key existed before insert, no-op here).
  if (
    tg_op = 'UPDATE'
    and old.role in ('admin', 'owner')
    and new.role not in ('admin', 'owner')
  ) then
    update public.api_keys
       set revoked_at = now(),
           updated_at = now()
     where created_by = old.user_id
       and org_id = old.organization_id
       and revoked_at is null;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."_fos_revoke_api_keys_for_demoted_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_fos_revoke_api_keys_for_removed_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  update public.api_keys
     set revoked_at = now(),
         updated_at = now()
   where created_by = old.user_id
     and org_id = old.organization_id
     and revoked_at is null;
  return old;
end;
$$;


ALTER FUNCTION "public"."_fos_revoke_api_keys_for_removed_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_touch_user_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."_touch_user_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invite"("p_token" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_inv public.org_invites%rowtype;
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_inv
  from public.org_invites
  where token = p_token
    and accepted_at is null
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  v_org_id := v_inv.org_id;

  insert into public.org_memberships (org_id, user_id, role, status, invited_by)
  values (v_org_id, auth.uid(), v_inv.role, 'active', v_inv.created_by)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        status = 'active',
        updated_at = now();

  update public.org_invites
  set accepted_at = now()
  where id = v_inv.id;

  return v_org_id;
end;
$$;


ALTER FUNCTION "public"."accept_invite"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_append"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone) RETURNS TABLE("id" "uuid", "sequence_number" bigint, "prev_hash" "text", "entry_hash" "text", "hash_algo" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
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
    p_id, p_org_id, p_user_id, p_action, p_resource_type, p_resource_id,
    v_details, v_created_at, v_prev_hash
  );

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


ALTER FUNCTION "public"."audit_log_append"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_append_v3"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone, "p_hmac_key" "bytea") RETURNS TABLE("id" "uuid", "sequence_number" bigint, "prev_hash" "text", "entry_hash" "text", "entry_mac" "text", "hash_algo" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
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
  v_canonical_bytes bytea;
BEGIN
  IF p_hmac_key IS NULL OR octet_length(p_hmac_key) <> 32 THEN
    RAISE EXCEPTION 'audit_log_append_v3 requires a 32-byte HMAC key';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('audit_log:' || COALESCE(p_org_id::text, '__global__')));

  SELECT al.entry_hash, al.sequence_number INTO v_prev_hash, v_prev_seq
    FROM public.audit_log al
   WHERE al.org_id IS NOT DISTINCT FROM p_org_id AND al.entry_hash IS NOT NULL
   ORDER BY al.sequence_number DESC NULLS LAST LIMIT 1;

  v_prev_hash := COALESCE(v_prev_hash, '');
  v_next_seq := COALESCE(v_prev_seq, 0) + 1;
  v_created_at := COALESCE(p_created_at, now());
  v_details := COALESCE(p_details, '{}'::jsonb);

  v_canonical := json_build_object(
    'id', p_id::text,
    'org_id', p_org_id::text,
    'user_id', p_user_id::text,
    'action', p_action,
    'resource_type', p_resource_type,
    'resource_id', CASE WHEN p_resource_id IS NULL THEN NULL ELSE p_resource_id::text END,
    'details', v_details,
    'created_at', to_char(v_created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'prev_hash', v_prev_hash
  )::text;

  v_canonical_bytes := convert_to(v_canonical, 'UTF8');
  v_entry_hash := encode(extensions.digest(v_canonical_bytes, 'sha256'), 'hex');
  v_entry_mac := encode(extensions.hmac(v_canonical_bytes, p_hmac_key, 'sha256'), 'hex');

  INSERT INTO public.audit_log (
    id, org_id, user_id,
    action, resource_type, resource_id, details,
    event_type, target_type, target_id, metadata,
    environment, ip_address, user_agent, created_at,
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


ALTER FUNCTION "public"."audit_log_append_v3"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone, "p_hmac_key" "bytea") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bootstrap_org_from_library"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_industry uuid;
begin
  select industry_id into v_industry
  from public.organizations
  where id = p_org_id;

  if v_industry is null then
    raise exception 'Organization % has no industry_id set', p_org_id;
  end if;

  insert into public.org_policies (org_id, template_id, code, name, category, summary, body_markdown, version, is_mandatory, is_active)
  select
    p_org_id,
    p.id,
    p.code,
    p.name,
    p.category,
    p.summary,
    coalesce(p.body_markdown, ''),
    p.version,
    p.is_mandatory,
    p.is_active
  from public.care_policy_templates p
  where p.industry_id = v_industry
    and p.is_active = true
  on conflict (org_id, code, version) do update
    set name = excluded.name,
        category = excluded.category,
        summary = excluded.summary,
        body_markdown = excluded.body_markdown,
        is_mandatory = excluded.is_mandatory,
        is_active = true;

  insert into public.org_registers (org_id, template_id, code, name, category, description, fields, is_active)
  select
    p_org_id,
    r.id,
    r.code,
    r.name,
    r.category,
    r.description,
    coalesce(r.default_fields, '[]'::jsonb),
    r.is_active
  from public.care_register_templates r
  where r.industry_id = v_industry
    and r.is_active = true
  on conflict (org_id, code) do update
    set name = excluded.name,
        category = excluded.category,
        description = excluded.description,
        fields = excluded.fields,
        is_active = true;

  insert into public.org_tasks (org_id, template_id, code, name, description, frequency, default_due_days, is_active)
  select
    p_org_id,
    t.id,
    t.code,
    t.name,
    t.description,
    t.frequency,
    t.default_due_days,
    t.is_active
  from public.care_task_templates t
  where t.industry_id = v_industry
    and t.is_active = true
  on conflict (org_id, code) do update
    set name = excluded.name,
        description = excluded.description,
        frequency = excluded.frequency,
        default_due_days = excluded.default_due_days,
        is_active = true;

  insert into public.org_audit_log (org_id, actor_user_id, action, entity_type, meta)
  values (p_org_id, app.current_user_id(), 'bootstrap_from_library', 'org', jsonb_build_object('industry_id', v_industry));
end;
$$;


ALTER FUNCTION "public"."bootstrap_org_from_library"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."care_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."care_set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."compliance_export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "framework_slug" "text" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "file_url" "text",
    "file_size" bigint,
    "password_protected" boolean DEFAULT false,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_run_at" timestamp with time zone DEFAULT "now"(),
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "last_error" "text",
    CONSTRAINT "export_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."compliance_export_jobs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_compliance_export_jobs"("p_limit" integer, "p_worker_id" "text") RETURNS SETOF "public"."compliance_export_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.compliance_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.compliance_export_jobs AS jobs
  SET status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      started_at = COALESCE(jobs.started_at, now()),
      attempt_count = COALESCE(jobs.attempt_count, 0) + 1,
      last_error = NULL
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;


ALTER FUNCTION "public"."claim_compliance_export_jobs"("p_limit" integer, "p_worker_id" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enterprise_export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "options" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "file_url" "text",
    "file_size" bigint,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_run_at" timestamp with time zone DEFAULT "now"(),
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "last_error" "text",
    CONSTRAINT "valid_progress" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."enterprise_export_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."enterprise_export_jobs" IS 'Tracks full organization data export jobs for enterprise portability';



COMMENT ON COLUMN "public"."enterprise_export_jobs"."options" IS 'Export options: includeCompliance, includeEvidence, includeAuditLogs, includeCareOps, includeTeam';



CREATE OR REPLACE FUNCTION "public"."claim_enterprise_export_jobs"("p_limit" integer, "p_worker_id" "text") RETURNS SETOF "public"."enterprise_export_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.enterprise_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.enterprise_export_jobs AS jobs
  SET status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      started_at = COALESCE(jobs.started_at, now()),
      attempt_count = COALESCE(jobs.attempt_count, 0) + 1,
      last_error = NULL
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;


ALTER FUNCTION "public"."claim_enterprise_export_jobs"("p_limit" integer, "p_worker_id" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "format" "text" DEFAULT 'pdf'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "file_url" "text",
    "file_size" bigint,
    "error_message" "text",
    "last_error" "text",
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "next_run_at" timestamp with time zone DEFAULT "now"(),
    "locked_at" timestamp with time zone,
    "locked_by" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "storage_path" "text",
    "storage_bucket" "text",
    CONSTRAINT "report_export_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."report_export_jobs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_report_export_jobs"("p_limit" integer, "p_worker_id" "text") RETURNS SETOF "public"."report_export_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.report_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.report_export_jobs AS jobs
  SET status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      started_at = COALESCE(jobs.started_at, now()),
      attempt_count = COALESCE(jobs.attempt_count, 0) + 1,
      last_error = NULL
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;


ALTER FUNCTION "public"."claim_report_export_jobs"("p_limit" integer, "p_worker_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_security_data"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Delete old security events (and cascade to alerts)
  DELETE FROM public.security_events
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete old user activity
  DELETE FROM public.user_activity
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete old revoked sessions
  DELETE FROM public.active_sessions
  WHERE revoked_at IS NOT NULL
    AND revoked_at < now() - INTERVAL '30 days';
    
  -- Delete stale sessions (not seen in 7 days)
  DELETE FROM public.active_sessions
  WHERE revoked_at IS NULL
    AND last_seen_at < now() - INTERVAL '7 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_security_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_backup_code_hash"("p_user_id" "uuid", "p_hash" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_was_present boolean;
BEGIN
  UPDATE public.user_security
  SET backup_code_hashes = array_remove(backup_code_hashes, p_hash)
  WHERE user_id = p_user_id
    AND p_hash = ANY(backup_code_hashes)
  RETURNING true INTO v_was_present;

  RETURN COALESCE(v_was_present, false);
END;
$$;


ALTER FUNCTION "public"."consume_backup_code_hash"("p_user_id" "uuid", "p_hash" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."consume_backup_code_hash"("p_user_id" "uuid", "p_hash" "text") IS 'Atomically consumes a single backup-code hash from user_security.backup_code_hashes. Returns true if the hash was present (and is now removed); false otherwise. Designed to be race-safe under concurrent 2FA verification — only one caller observes the removal even when both pass the JS-side scrypt match.';



CREATE OR REPLACE FUNCTION "public"."control_plane_prevent_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  raise exception 'audit_log records are immutable';
end;
$$;


ALTER FUNCTION "public"."control_plane_prevent_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."control_plane_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."control_plane_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_email_preferences_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  BEGIN
    INSERT INTO public.email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'create_email_preferences_for_new_user suppressed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_email_preferences_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invite"("p_org_id" "uuid", "p_email" "text", "p_role" "public"."org_role" DEFAULT 'worker'::"public"."org_role", "p_days_valid" integer DEFAULT 7) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_token text;
begin
  if not public.is_org_admin(p_org_id) then
    raise exception 'Not allowed';
  end if;

  v_token := encode(gen_random_bytes(24), 'hex');

  insert into public.org_invites (org_id, email, role, token, expires_at, created_by)
  values (p_org_id, lower(p_email), p_role, v_token, now() + make_interval(days => p_days_valid), auth.uid());

  return v_token;
end;
$$;


ALTER FUNCTION "public"."create_invite"("p_org_id" "uuid", "p_email" "text", "p_role" "public"."org_role", "p_days_valid" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_prefs_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  BEGIN
    INSERT INTO public.org_notification_prefs (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'create_notification_prefs_for_new_user suppressed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_prefs_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_org"("p_name" "text", "p_slug" "text" DEFAULT NULL::"text", "p_primary_industry_code" "text" DEFAULT 'ndis_provider'::"text", "p_timezone" "text" DEFAULT 'Australia/Adelaide'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_org_id uuid;
  v_industry_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_industry_id
  from public.care_industries
  where code = p_primary_industry_code
  limit 1;

  if v_industry_id is null then
    raise exception 'Invalid industry code: %', p_primary_industry_code;
  end if;

  insert into public.orgs (name, slug, primary_industry_id, timezone, created_by)
  values (p_name, p_slug, v_industry_id, p_timezone, auth.uid())
  returning id into v_org_id;

  insert into public.org_memberships (org_id, user_id, role, status)
  values (v_org_id, auth.uid(), 'owner', 'active')
  on conflict (org_id, user_id) do update
    set role = 'owner', status = 'active', updated_at = now();

  insert into public.org_industries (org_id, industry_id, is_primary)
  values (v_org_id, v_industry_id, true)
  on conflict (org_id, industry_id) do update
    set is_primary = true;

  insert into public.org_subscriptions (org_id, plan_code, status, trial_ends_at)
  values (v_org_id, 'free', 'active', null)
  on conflict (org_id) do update
    set plan_code = excluded.plan_code,
        status = excluded.status,
        updated_at = now();

  -- Enable modules based on plan features.modules
  insert into public.org_module_entitlements (org_id, module_code, enabled)
  select v_org_id, m::text, true
  from jsonb_array_elements_text(
    (select features->'modules' from public.billing_plans where code = 'free')
  ) as m
  on conflict (org_id, module_code) do update
    set enabled = true,
        updated_at = now();

  return v_org_id;
end;
$$;


ALTER FUNCTION "public"."create_org"("p_name" "text", "p_slug" "text", "p_primary_industry_code" "text", "p_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_security_alert"("p_event_id" "uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (event_id, notes)
  VALUES (p_event_id, p_notes)
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;


ALTER FUNCTION "public"."create_security_alert"("p_event_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_admin_org_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT organization_id
  FROM public.org_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
$$;


ALTER FUNCTION "public"."current_user_admin_org_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_org_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT organization_id
  FROM public.org_members
  WHERE user_id = auth.uid()
$$;


ALTER FUNCTION "public"."current_user_org_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_profile_from_org_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  org_id UUID;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
      AND column_name = 'organization_id'
  ) THEN
    org_id := NEW.organization_id;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
      AND column_name = 'org_id'
  ) THEN
    org_id := NEW.org_id;
  ELSE
    RETURN NEW;
  END IF;

  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_profiles (user_id, organization_id)
  VALUES (NEW.user_id, org_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."ensure_user_profile_from_org_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_master_control"("p_title" "text", "p_description" "text", "p_risk_level" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
DECLARE
  v_master_id uuid;
  v_control_code text;
BEGIN
  -- Generate normalized control code from title
  v_control_code := 'MC-' || substring(md5(lower(trim(p_title))), 1, 8);

  -- Try to find existing master control by code or similar title
  SELECT id INTO v_master_id
  FROM master_controls
  WHERE control_code = v_control_code
     OR lower(title) = lower(trim(p_title))
  LIMIT 1;

  IF v_master_id IS NULL THEN
    -- Create new master control
    INSERT INTO master_controls (control_code, title, description, risk_level)
    VALUES (v_control_code, trim(p_title), p_description, p_risk_level)
    RETURNING id INTO v_master_id;
  END IF;

  RETURN v_master_id;
END;
$$;


ALTER FUNCTION "public"."find_or_create_master_control"("p_title" "text", "p_description" "text", "p_risk_level" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_renewal_tasks"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    INSERT INTO org_tasks (organization_id, assigned_to, title, description, priority, status)
    SELECT 
        organization_id, 
        user_id, 
        'Renew ' || document_type, 
        'Your ' || document_type || ' is expiring on ' || expiry_date || '. Please upload a new version.',
        'critical',
        'pending'
    FROM at_risk_credentials
    ON CONFLICT DO NOTHING; -- Prevents duplicate tasks for the same expiry
END;
$$;


ALTER FUNCTION "public"."generate_renewal_tasks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("p_org" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = p_org
      and m.user_id = app.current_user_id()
      and m.status = 'active'
      and m.role in ('owner','admin')
  );
$$;


ALTER FUNCTION "public"."is_org_admin"("p_org" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."latest_restore_test_run"() RETURNS TABLE("performed_at" timestamp with time zone, "outcome" "text", "days_since" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT r.performed_at, r.outcome, EXTRACT(EPOCH FROM (now() - r.performed_at))::integer / 86400
  FROM public.restore_test_runs r WHERE r.outcome IN ('passed','partial')
  ORDER BY r.performed_at DESC LIMIT 1;
$$;


ALTER FUNCTION "public"."latest_restore_test_run"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_migration_ledger"() RETURNS TABLE("version" "text", "name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'supabase_migrations', 'public', 'pg_temp'
    AS $$
  SELECT version, name
  FROM supabase_migrations.schema_migrations
  ORDER BY version;
$$;


ALTER FUNCTION "public"."list_migration_ledger"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."list_migration_ledger"() IS 'R6 (2026-05-27): exposes supabase_migrations.schema_migrations to service_role for the ledger-alignment diagnostic. Read-only.';



CREATE OR REPLACE FUNCTION "public"."list_security_definer_anon_grants"() RETURNS TABLE("function_name" "text", "argument_signature" "text", "anon_can_execute" boolean, "authenticated_can_execute" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog', 'pg_temp'
    AS $$
  SELECT
    p.proname::text AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid)::text AS argument_signature,
    pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (
      pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
      OR pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
  ORDER BY p.proname;
$$;


ALTER FUNCTION "public"."list_security_definer_anon_grants"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."list_security_definer_anon_grants"() IS 'CI helper (Audit 2026-05-27): lists SECURITY DEFINER functions in public that are still callable by anon or authenticated. Used by scripts/check-security-definer-grants.mjs to catch default-grant drift.';



CREATE OR REPLACE FUNCTION "public"."log_email_send"("p_email_type" "text", "p_recipient_email" "text", "p_subject" "text", "p_status" "text" DEFAULT 'sent'::"text", "p_resend_id" "text" DEFAULT NULL::"text", "p_error_message" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_organization_id" "uuid" DEFAULT NULL::"uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_log_id uuid;
begin
  insert into email_logs (
    email_type,
    recipient_email,
    subject,
    status,
    resend_id,
    error_message,
    metadata,
    organization_id,
    user_id
  ) values (
    p_email_type,
    p_recipient_email,
    p_subject,
    p_status,
    p_resend_id,
    p_error_message,
    p_metadata,
    p_organization_id,
    p_user_id
  )
  returning id into v_log_id;
  
  return v_log_id;
end;
$$;


ALTER FUNCTION "public"."log_email_send"("p_email_type" "text", "p_recipient_email" "text", "p_subject" "text", "p_status" "text", "p_resend_id" "text", "p_error_message" "text", "p_metadata" "jsonb", "p_organization_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_generic_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO org_audit_log (org_id, activity_type, description, created_at)
  VALUES (
    NEW.org_id, 
    TG_TABLE_NAME || '_ACTIVITY', 
    'A record was modified in ' || TG_TABLE_NAME,
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_generic_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_policy_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO org_audit_log (org_id, activity_type, description)
  VALUES (NEW.org_id, 'POLICY_CREATED', 'New policy created: ' || NEW.name);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_policy_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_org_ids"() RETURNS TABLE("org_id" "uuid")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select m.org_id
  from public.org_members m
  where m.user_id = app.current_user_id()
    and m.status = 'active';
$$;


ALTER FUNCTION "public"."my_org_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."org_care_plans_snapshot_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_next_version integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
    FROM public.org_care_plan_versions
   WHERE care_plan_id = OLD.id;

  INSERT INTO public.org_care_plan_versions (
    care_plan_id, organization_id, version_number, snapshot_json, changed_by, change_reason
  ) VALUES (
    OLD.id, OLD.organization_id, v_next_version, to_jsonb(OLD), auth.uid(), NULL
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."org_care_plans_snapshot_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."org_progress_notes_block_signed_updates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
BEGIN
  IF OLD.signed_off_at IS NOT NULL THEN
    IF NEW.note_text IS DISTINCT FROM OLD.note_text
       OR NEW.status_tag IS DISTINCT FROM OLD.status_tag
       OR NEW.signed_off_by IS DISTINCT FROM OLD.signed_off_by
       OR NEW.signed_off_at IS DISTINCT FROM OLD.signed_off_at THEN
      RAISE EXCEPTION
        'Signed-off progress notes are immutable. Create a correction note instead. (note_id=%)',
        OLD.id
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."org_progress_notes_block_signed_updates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_audit_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  raise exception 'Audit records are immutable';
end;
$$;


ALTER FUNCTION "public"."prevent_audit_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_org_control_evaluations_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  raise exception 'org_control_evaluations snapshots are immutable';
end;
$$;


ALTER FUNCTION "public"."prevent_org_control_evaluations_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_restore_test_run"("p_performed_by" "text", "p_outcome" "text", "p_rpo_target_minutes" integer, "p_rto_target_minutes" integer, "p_restored_pitr_target" "text", "p_restored_branch_id" "text", "p_duration_minutes" integer, "p_invariants_checked" "text"[], "p_invariants_failed" "text"[], "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.restore_test_runs (performed_by, outcome, rpo_target_minutes, rto_target_minutes, restored_pitr_target, restored_branch_id, duration_minutes, invariants_checked, invariants_failed, notes)
  VALUES (p_performed_by, p_outcome, p_rpo_target_minutes, p_rto_target_minutes, p_restored_pitr_target, p_restored_branch_id, p_duration_minutes, p_invariants_checked, p_invariants_failed, p_notes)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;


ALTER FUNCTION "public"."record_restore_test_run"("p_performed_by" "text", "p_outcome" "text", "p_rpo_target_minutes" integer, "p_rto_target_minutes" integer, "p_restored_pitr_target" "text", "p_restored_branch_id" "text", "p_duration_minutes" integer, "p_invariants_checked" "text"[], "p_invariants_failed" "text"[], "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_secret_rotation"("p_secret_name" "text", "p_reason" "text", "p_rotated_by" "text", "p_previous_fingerprint" "text", "p_new_fingerprint" "text", "p_notes" "text" DEFAULT NULL::"text", "p_ticket_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.secret_rotations (secret_name, rotated_by, reason, previous_value_fingerprint, new_value_fingerprint, notes, ticket_url)
  VALUES (p_secret_name, p_rotated_by, p_reason, p_previous_fingerprint, p_new_fingerprint, p_notes, p_ticket_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."record_secret_rotation"("p_secret_name" "text", "p_reason" "text", "p_rotated_by" "text", "p_previous_fingerprint" "text", "p_new_fingerprint" "text", "p_notes" "text", "p_ticket_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_bootstrap_user"("p_user_id" "uuid", "p_user_email" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_actions text[] := ARRAY[]::text[];
  v_now timestamptz := now();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  SELECT m.organization_id
  INTO v_org_id
  FROM public.org_members m
  WHERE m.user_id = p_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    v_org_name := concat(
      COALESCE(NULLIF(split_part(COALESCE(p_user_email, 'user'), '@', 1), ''), 'user'),
      '''s Organization'
    );

    INSERT INTO public.organizations (
      name,
      created_by,
      plan_key,
      plan_selected_at,
      onboarding_completed
    )
    VALUES (
      v_org_name,
      p_user_id,
      'basic',
      v_now,
      false
    )
    RETURNING id INTO v_org_id;

    v_actions := array_append(v_actions, 'org_created');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE organization_id = v_org_id
      AND user_id = p_user_id
  ) THEN
    INSERT INTO public.org_members (organization_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    v_actions := array_append(v_actions, 'membership_created');
  END IF;

  UPDATE public.org_members
  SET role = COALESCE(NULLIF(role, ''), 'member')
  WHERE organization_id = v_org_id
    AND user_id = p_user_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.org_onboarding_status
    WHERE organization_id = v_org_id
  ) THEN
    INSERT INTO public.org_onboarding_status (
      organization_id,
      current_step,
      completed_steps,
      updated_at
    )
    VALUES (
      v_org_id,
      1,
      ARRAY[]::integer[],
      v_now
    );
    v_actions := array_append(v_actions, 'onboarding_status_created');
  END IF;

  IF to_regclass('public.orgs') IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.orgs
    WHERE id = v_org_id
  ) THEN
    INSERT INTO public.orgs (id, name, created_by, created_at, updated_at)
    VALUES (v_org_id, COALESCE(v_org_name, 'Organization'), p_user_id, v_now, v_now);
    v_actions := array_append(v_actions, 'legacy_org_created');
  END IF;

  IF to_regclass('public.user_profiles') IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = p_user_id
  ) THEN
    INSERT INTO public.user_profiles (user_id, organization_id)
    VALUES (p_user_id, v_org_id);
    v_actions := array_append(v_actions, 'user_profile_created');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'organization_id', v_org_id,
    'actions', v_actions
  );
END;
$$;


ALTER FUNCTION "public"."rpc_bootstrap_user"("p_user_id" "uuid", "p_user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_uuid"("t" "text") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
select
  case
    when t ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then t::uuid
    else null
  end;
$_$;


ALTER FUNCTION "public"."safe_uuid"("t" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_embeddings"("p_org_id" "uuid", "p_query_embedding" "extensions"."vector", "p_source_types" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 10, "p_similarity_threshold" double precision DEFAULT 0.7) RETURNS TABLE("id" "uuid", "source_type" "text", "source_id" "uuid", "chunk_index" integer, "chunk_text" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source_type,
    e.source_id,
    e.chunk_index,
    e.chunk_text,
    e.metadata,
    1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM ai_document_embeddings e
  WHERE e.org_id = p_org_id
    AND (p_source_types IS NULL OR e.source_type = ANY(p_source_types))
    AND 1 - (e.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."search_embeddings"("p_org_id" "uuid", "p_query_embedding" "extensions"."vector", "p_source_types" "text"[], "p_limit" integer, "p_similarity_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_entities"("p_org_id" "uuid", "p_query" "text", "p_entity_types" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("entity_type" "text", "entity_id" "uuid", "title" "text", "snippet" "text", "rank" real, "metadata" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select
    si.entity_type,
    si.entity_id,
    si.title,
    ts_headline('english', si.body, websearch_to_tsquery('english', p_query),
      'MaxWords=40, MinWords=20, StartSel=<mark>, StopSel=</mark>') as snippet,
    ts_rank(si.search_vector, websearch_to_tsquery('english', p_query)) as rank,
    si.metadata
  from search_index si
  where si.org_id = p_org_id
    and si.search_vector @@ websearch_to_tsquery('english', p_query)
    and (p_entity_types is null or si.entity_type = any(p_entity_types))
  order by rank desc
  limit p_limit
  offset p_offset;
$$;


ALTER FUNCTION "public"."search_entities"("p_org_id" "uuid", "p_query" "text", "p_entity_types" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_mfa_required_on_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.role IN ('owner', 'admin', 'OWNER', 'COMPLIANCE_OFFICER', 'MANAGER') THEN
    NEW.mfa_required := true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_mfa_required_on_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."snapshot_dormant_users"("p_threshold_days" integer DEFAULT 730) RETURNS TABLE("review_id" "uuid", "candidate_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_ids uuid[];
  v_count integer;
  v_review_id uuid;
BEGIN
  SELECT array_agg(user_id), count(*) INTO v_ids, v_count
  FROM (
    SELECT u.id AS user_id FROM auth.users u
    WHERE u.confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND u.banned_until IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.org_members m WHERE m.user_id = u.id)
      AND COALESCE(u.last_sign_in_at, u.created_at) < now() - (p_threshold_days || ' days')::interval
      AND NOT EXISTS (SELECT 1 FROM public.user_purge_jobs upj WHERE upj.user_id = u.id)
  ) candidates;
  INSERT INTO public.dormant_user_reviews (candidate_count, threshold_days, candidate_user_ids)
  VALUES (COALESCE(v_count, 0), p_threshold_days, COALESCE(v_ids, ARRAY[]::uuid[]))
  RETURNING id INTO v_review_id;
  RETURN QUERY SELECT v_review_id, COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."snapshot_dormant_users"("p_threshold_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_evidence_freshness"("p_org_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  updated_count int := 0;
begin
  -- Mark expired
  update org_evidence
  set freshness_status = 'expired'
  where organization_id = p_org_id
    and valid_until is not null
    and valid_until < current_date
    and freshness_status != 'expired';
  get diagnostics updated_count = row_count;

  -- Mark expiring soon (within 30 days)
  update org_evidence
  set freshness_status = 'expiring_soon'
  where organization_id = p_org_id
    and valid_until is not null
    and valid_until >= current_date
    and valid_until <= current_date + interval '30 days'
    and freshness_status not in ('expired');

  -- Mark needs review (review cycle exceeded)
  update org_evidence
  set freshness_status = 'needs_review'
  where organization_id = p_org_id
    and review_cycle_days is not null
    and last_reviewed_at is not null
    and last_reviewed_at + (review_cycle_days || ' days')::interval < now()
    and freshness_status not in ('expired', 'expiring_soon');

  -- Mark current (valid and not needing review)
  update org_evidence
  set freshness_status = 'current'
  where organization_id = p_org_id
    and (valid_until is null or valid_until > current_date + interval '30 days')
    and (review_cycle_days is null or last_reviewed_at is null or
         last_reviewed_at + (review_cycle_days || ' days')::interval >= now())
    and freshness_status != 'current';

  return updated_count;
end;
$$;


ALTER FUNCTION "public"."update_evidence_freshness"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_org_forms_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_org_forms_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_security_alerts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_security_alerts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_heartbeat"("p_session_id" "text", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.active_sessions
  SET last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;
    
  -- If no rows updated, insert new session
  IF NOT FOUND THEN
    INSERT INTO public.active_sessions (session_id, user_id)
    VALUES (p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now();
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_session_heartbeat"("p_session_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trust_packets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trust_packets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_workflow_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_workflow_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."__pre_orgs_sync_2026_05_25_orgs_only" (
    "id" "uuid",
    "name" "text",
    "slug" "text",
    "primary_industry_id" "uuid",
    "timezone" "text",
    "status" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" OWNER TO "postgres";


COMMENT ON TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" IS 'Snapshot of `orgs` rows that had no matching `organizations` parent at the moment of 20260624027 cleanup. Safe to drop after a recovery window has elapsed.';



CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "ip_address" "inet",
    "user_agent" "text",
    "device_fingerprint" "text",
    "geo_country" "text",
    "geo_region" "text",
    "geo_city" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."active_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."admin_audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "logs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "result" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text",
    "requested_by" "uuid",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_jobs_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "admin_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'succeeded'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."admin_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_jobs" IS 'Background automation jobs triggered from admin control plane';



CREATE TABLE IF NOT EXISTS "public"."admin_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "user_id" "uuid",
    "note" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_document_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "chunk_index" integer DEFAULT 0 NOT NULL,
    "chunk_text" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_document_embeddings_source_type_check" CHECK (("source_type" = ANY (ARRAY['evidence'::"text", 'policy'::"text", 'control'::"text", 'task'::"text", 'form_submission'::"text", 'care_plan'::"text", 'incident'::"text"])))
);


ALTER TABLE "public"."ai_document_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_index_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "chunk_count" integer DEFAULT 0,
    "indexed_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'indexed'::"text",
    "error_message" "text",
    CONSTRAINT "ai_index_status_status_check" CHECK (("status" = ANY (ARRAY['indexed'::"text", 'pending'::"text", 'failed'::"text", 'stale'::"text"])))
);


ALTER TABLE "public"."ai_index_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "risk_analysis_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "confidence" numeric(3,2) NOT NULL,
    "impact" character varying(20) NOT NULL,
    "actionable" boolean DEFAULT false,
    "suggested_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_insights_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "ai_insights_impact_check" CHECK ((("impact")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[]))),
    CONSTRAINT "ai_insights_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['prediction'::character varying, 'anomaly'::character varying, 'recommendation'::character varying, 'optimization'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "model" "text" DEFAULT 'gpt-4o-mini'::"text" NOT NULL,
    "input_tokens" integer DEFAULT 0 NOT NULL,
    "output_tokens" integer DEFAULT 0 NOT NULL,
    "total_tokens" integer DEFAULT 0 NOT NULL,
    "cost_usd" numeric(10,6) DEFAULT 0,
    "conversation_id" "uuid",
    "feature" "text" DEFAULT 'chat'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_alert_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "error_rate_threshold" numeric(5,2) DEFAULT 10.0,
    "response_time_threshold" integer DEFAULT 5000,
    "request_rate_threshold" integer DEFAULT 1000,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_alert_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "endpoint" character varying(255) NOT NULL,
    "method" character varying(10) NOT NULL,
    "status_code" integer NOT NULL,
    "response_time" integer NOT NULL,
    "error_message" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_usage_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."api_health" WITH ("security_invoker"='true') AS
 SELECT "organization_id",
    "date"("timestamp") AS "date",
    "count"(*) AS "total_requests",
    "avg"("response_time") AS "avg_response_time",
    "count"(*) FILTER (WHERE ("status_code" >= 500)) AS "server_errors",
    "count"(*) FILTER (WHERE (("status_code" >= 400) AND ("status_code" <= 499))) AS "client_errors",
    "count"(*) FILTER (WHERE (("status_code" >= 200) AND ("status_code" <= 299))) AS "successful_requests"
   FROM "public"."api_usage_logs"
  GROUP BY "organization_id", ("date"("timestamp"));


ALTER VIEW "public"."api_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_key_usage_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "api_key_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "scope" "text",
    "method" "text" NOT NULL,
    "path" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."api_key_usage_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_key_usage_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_key_usage_log" IS 'API key usage log. INSERTs only via service_role (bypasses RLS). SELECT via org membership. UPDATE/DELETE forbidden.';



CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "prefix" "text" NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "rate_limit" integer DEFAULT 120 NOT NULL,
    "last_used" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."api_keys" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_modules" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_credentials" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "user_id" "uuid",
    "document_type" "text" NOT NULL,
    "issue_date" "date",
    "expiry_date" "date",
    "file_path" "text" NOT NULL,
    "verification_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_credentials" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    "theme_preference" "text" DEFAULT 'dark'::"text" NOT NULL,
    "plain_english_mode" boolean DEFAULT true NOT NULL,
    CONSTRAINT "user_profiles_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['dark'::"text", 'midnight-blue'::"text", 'graphite'::"text", 'light'::"text", 'aurora'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_profiles_public" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "organization_id",
    "full_name",
    "created_at",
    "updated_at"
   FROM "public"."user_profiles" "up";


ALTER VIEW "public"."user_profiles_public" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."at_risk_credentials" WITH ("security_invoker"='true') AS
 SELECT "oc"."id",
    "oc"."organization_id",
    "oc"."user_id",
    "oc"."expiry_date",
    "upp"."full_name" AS "staff_name",
    NULL::"text" AS "staff_avatar"
   FROM ("public"."org_credentials" "oc"
     LEFT JOIN "public"."user_profiles_public" "upp" ON ((("upp"."user_id" = "oc"."user_id") AND ("upp"."organization_id" = "oc"."organization_id"))))
  WHERE (("oc"."expiry_date" >= "now"()) AND ("oc"."expiry_date" <= ("now"() + '30 days'::interval)));


ALTER VIEW "public"."at_risk_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_chain_anchors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "anchored_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "top_sequence_number" bigint NOT NULL,
    "top_entry_hash" "text" NOT NULL,
    "external_anchor_id" "text" NOT NULL,
    "external_provider" "text" NOT NULL,
    "external_anchor_url" "text",
    CONSTRAINT "audit_chain_anchors_provider_check" CHECK (("external_provider" = ANY (ARRAY['sigstore-rekor'::"text", 'internal-test'::"text"])))
);

ALTER TABLE ONLY "public"."audit_chain_anchors" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_chain_anchors" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_chain_anchors" IS 'R3 + external anchor (2026-05-27): each row records a hash-chain top-entry submitted to an external transparency log. RESTRICTIVE policies enforce append-only. Org members can SELECT their own anchors; service_role writes.';



CREATE TABLE IF NOT EXISTS "public"."audit_chain_secrets" (
    "org_id" "uuid" NOT NULL,
    "encrypted_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rotated_at" timestamp with time zone,
    "algorithm" "text" DEFAULT 'hmac-sha256'::"text" NOT NULL,
    CONSTRAINT "audit_chain_secrets_algorithm_check" CHECK (("algorithm" = 'hmac-sha256'::"text"))
);

ALTER TABLE ONLY "public"."audit_chain_secrets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_chain_secrets" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_chain_secrets" IS 'R3 (2026-05-27): per-org HMAC keys for the v3-hmac audit chain. Service-role-only.';



CREATE TABLE IF NOT EXISTS "public"."audit_export_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "date_from" "date" NOT NULL,
    "date_to" "date" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "file_url" "text",
    "file_size_bytes" bigint,
    "created_by" "uuid" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_export_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."audit_export_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "event_type" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "text",
    "environment" "text" DEFAULT 'production'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "entry_hash" "text",
    "prev_hash" "text",
    "sequence_number" bigint,
    "org_id" "uuid",
    "user_id" "uuid",
    "action" "text",
    "resource_type" "text",
    "resource_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "hash_algo" "text" DEFAULT 'v1'::"text" NOT NULL,
    "entry_mac" "text"
);

ALTER TABLE ONLY "public"."audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_log" IS 'Immutable admin control-plane audit stream';



COMMENT ON COLUMN "public"."audit_log"."entry_mac" IS 'R3 (2026-05-27): HMAC-SHA-256 over canonical JSON, keyed with per-org secret.';



CREATE TABLE IF NOT EXISTS "public"."audit_retention_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "retention_days" integer DEFAULT 365 NOT NULL,
    "archive_after_days" integer DEFAULT 730,
    "immutable_period_days" integer DEFAULT 90 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_retention_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auditor_access_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "auditor_name" "text" NOT NULL,
    "auditor_email" "text" NOT NULL,
    "auditor_company" "text",
    "token_hash" "text" NOT NULL,
    "scopes" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone NOT NULL,
    "last_accessed_at" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."auditor_access_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auditor_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "auditor_activity_log_action_check" CHECK (("action" = ANY (ARRAY['viewed_evidence'::"text", 'downloaded_evidence'::"text", 'viewed_control'::"text", 'viewed_report'::"text", 'exported_data'::"text", 'viewed_dashboard'::"text"])))
);


ALTER TABLE "public"."auditor_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_events" (
    "id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "last_error" "text",
    CONSTRAINT "billing_events_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'succeeded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."billing_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_events_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_charge_id" "text",
    "amount" integer,
    "currency" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."billing_events_audit" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_events_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_plans" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "interval" "text" DEFAULT 'month'::"text" NOT NULL,
    "max_users" integer,
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."billing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_reconciliation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "checked_at" timestamp with time zone DEFAULT "now"(),
    "discrepancy_type" "text" NOT NULL,
    "local_value" "jsonb",
    "stripe_value" "jsonb",
    "auto_fixed" boolean DEFAULT false,
    "fixed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."billing_reconciliation_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."billing_reconciliation_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."billing_reconciliation_log" IS 'Tracks discrepancies found between local subscription state and Stripe';



COMMENT ON COLUMN "public"."billing_reconciliation_log"."discrepancy_type" IS 'Type: status_mismatch, plan_mismatch, period_end_mismatch, missing_stripe_subscription, orphaned_local_subscription, entitlement_drift';



CREATE TABLE IF NOT EXISTS "public"."care_industries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."care_industries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_policy_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "industry_id" "uuid" NOT NULL,
    "service_type_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "summary" "text",
    "body_markdown" "text",
    "is_mandatory" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."care_policy_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_register_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "industry_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "default_fields" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."care_register_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_service_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "industry_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."care_service_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "industry_id" "uuid" NOT NULL,
    "register_template_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "frequency" "text",
    "default_due_days" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."care_task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" character varying(10) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "mentions" "jsonb" DEFAULT '[]'::"jsonb",
    "parent_id" "uuid",
    "edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_controls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "framework_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "domain" "text",
    "risk_weight" integer DEFAULT 1 NOT NULL,
    "is_mandatory" boolean DEFAULT true NOT NULL,
    "evaluation_mode" "text" DEFAULT 'manual'::"text" NOT NULL,
    "expected_evidence_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "framework_control_id" "uuid",
    "is_deprecated" boolean DEFAULT false NOT NULL,
    CONSTRAINT "compliance_controls_evaluation_mode_check" CHECK (("evaluation_mode" = ANY (ARRAY['manual'::"text", 'semi_auto'::"text", 'auto'::"text"])))
);


ALTER TABLE "public"."compliance_controls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_frameworks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "version" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compliance_frameworks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_playbook_controls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "playbook_id" "uuid" NOT NULL,
    "control_id" "uuid" NOT NULL,
    "required_evidence_count" integer,
    "required_evidence_types" "text"[],
    "review_cadence_days" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compliance_playbook_controls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_playbooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "framework_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "review_cadence_days" integer,
    "required_evidence_types" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compliance_playbooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scan_id" character varying(255) NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "framework" character varying(50) NOT NULL,
    "scan_type" character varying(20) NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone NOT NULL,
    "total_requirements" integer DEFAULT 0,
    "compliant" integer DEFAULT 0,
    "non_compliant" integer DEFAULT 0,
    "partial" integer DEFAULT 0,
    "not_applicable" integer DEFAULT 0,
    "compliance_score" integer NOT NULL,
    "findings" "jsonb" DEFAULT '[]'::"jsonb",
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "compliance_scans_compliance_score_check" CHECK ((("compliance_score" >= 0) AND ("compliance_score" <= 100))),
    CONSTRAINT "compliance_scans_framework_check" CHECK ((("framework")::"text" = ANY ((ARRAY['soc2'::character varying, 'iso27001'::character varying, 'hipaa'::character varying, 'gdpr'::character varying, 'pci_dss'::character varying, 'nist'::character varying, 'custom'::character varying])::"text"[]))),
    CONSTRAINT "compliance_scans_scan_type_check" CHECK ((("scan_type")::"text" = ANY ((ARRAY['full'::character varying, 'incremental'::character varying, 'targeted'::character varying, 'quick'::character varying])::"text"[])))
);


ALTER TABLE "public"."compliance_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_score_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "framework_slug" "text" NOT NULL,
    "snapshot_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "compliance_score" integer NOT NULL,
    "total_controls" integer DEFAULT 0 NOT NULL,
    "satisfied_controls" integer DEFAULT 0 NOT NULL,
    "partial_controls" integer DEFAULT 0 NOT NULL,
    "missing_controls" integer DEFAULT 0 NOT NULL,
    "evidence_count" integer DEFAULT 0 NOT NULL,
    "task_completion_rate" numeric(5,2) DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compliance_score_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_findings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scan_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "requirement_id" character varying(255) NOT NULL,
    "status" character varying(20) NOT NULL,
    "severity" character varying(20) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "remediation" "text" NOT NULL,
    "estimated_effort" integer DEFAULT 0,
    "evidence" "jsonb" DEFAULT '[]'::"jsonb",
    "detected_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scan_findings_severity_check" CHECK ((("severity")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[]))),
    CONSTRAINT "scan_findings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['compliant'::character varying, 'non_compliant'::character varying, 'partial'::character varying, 'not_applicable'::character varying])::"text"[])))
);


ALTER TABLE "public"."scan_findings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."compliance_status" WITH ("security_invoker"='true') AS
 SELECT "cs"."organization_id",
    "cs"."framework",
    "cs"."compliance_score",
    "cs"."completed_at",
    "cs"."non_compliant",
    "count"("sf"."id") AS "critical_findings"
   FROM ("public"."compliance_scans" "cs"
     LEFT JOIN "public"."scan_findings" "sf" ON ((("sf"."scan_id" = "cs"."id") AND (("sf"."severity")::"text" = 'critical'::"text"))))
  GROUP BY "cs"."id", "cs"."organization_id", "cs"."framework", "cs"."compliance_score", "cs"."completed_at", "cs"."non_compliant";


ALTER VIEW "public"."compliance_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "control_id" "uuid" NOT NULL,
    "evidence_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "entity_id" "uuid",
    CONSTRAINT "control_evidence_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."control_evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "framework" "text" NOT NULL,
    "control_id" "text" NOT NULL
);


ALTER TABLE "public"."control_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."control_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_control_id" "uuid" NOT NULL,
    "framework_slug" "text" NOT NULL,
    "external_control_reference" "text" NOT NULL,
    "mapping_strength" "text" NOT NULL,
    CONSTRAINT "control_mappings_strength_check" CHECK (("mapping_strength" = ANY (ARRAY['primary'::"text", 'secondary'::"text"])))
);


ALTER TABLE "public"."control_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."control_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "control_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "entity_id" "uuid"
);


ALTER TABLE "public"."control_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_role" "text" DEFAULT 'member'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "custom_roles_base_role_check" CHECK (("base_role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."custom_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_layouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_id" character varying(255) NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "widget_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "size" character varying(20) DEFAULT 'medium'::character varying,
    "position" "jsonb" DEFAULT '{"x": 0, "y": 0}'::"jsonb",
    "refresh_interval" integer DEFAULT 60,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "name" "text" DEFAULT 'My Dashboard'::"text",
    "is_default" boolean DEFAULT false,
    "widgets" "jsonb" DEFAULT '[]'::"jsonb",
    "org_id" "uuid",
    CONSTRAINT "dashboard_layouts_size_check" CHECK ((("size")::"text" = ANY ((ARRAY['small'::character varying, 'medium'::character varying, 'large'::character varying])::"text"[]))),
    CONSTRAINT "dashboard_layouts_widget_type_check" CHECK ((("widget_type")::"text" = ANY ((ARRAY['risk_score'::character varying, 'certificate_status'::character varying, 'task_progress'::character varying, 'compliance_score'::character varying, 'team_activity'::character varying, 'trend_chart'::character varying, 'recent_alerts'::character varying, 'quick_stats'::character varying])::"text"[])))
);


ALTER TABLE "public"."dashboard_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_widget_registry" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "widget_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "min_width" integer DEFAULT 1 NOT NULL,
    "min_height" integer DEFAULT 1 NOT NULL,
    "default_width" integer DEFAULT 2 NOT NULL,
    "default_height" integer DEFAULT 2 NOT NULL,
    "required_plan" "text" DEFAULT 'starter'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_widget_registry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_lifecycle_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "performed_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_lifecycle_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "department" "text",
    "start_date" "date",
    "compliance_status" "text" DEFAULT 'active'::"text",
    "mfa_required" boolean DEFAULT false,
    "employee_onboarded_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."org_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."org_members"."employee_onboarded_at" IS 'Timestamp of when this member completed the employee onboarding wizard. NULL means not yet completed.';



CREATE TABLE IF NOT EXISTS "public"."user_purge_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_by" "uuid",
    "reason" "text" NOT NULL,
    "request_source" "text" DEFAULT 'admin'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "table_counts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "failed_step" "text",
    "error_message" "text",
    "refuse_reason" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_purge_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'partial'::"text", 'failed'::"text", 'refused'::"text"])))
);

ALTER TABLE ONLY "public"."user_purge_jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_purge_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_purge_jobs" IS 'P0-8: GDPR Right-to-Erasure ledger. Each row tracks one purge from request to completion. table_counts JSON holds per-table action + row counts so partial failures surface in the admin UI rather than silently going lost.';



CREATE OR REPLACE VIEW "public"."dormant_user_candidates" WITH ("security_invoker"='true') AS
 SELECT "id" AS "user_id",
    "email",
    "last_sign_in_at",
    "created_at" AS "user_created_at",
    (EXTRACT(epoch FROM ("now"() - COALESCE("last_sign_in_at", "created_at"))) / (86400)::numeric) AS "days_since_active"
   FROM "auth"."users" "u"
  WHERE (("confirmed_at" IS NOT NULL) AND ("deleted_at" IS NULL) AND ("banned_until" IS NULL) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."org_members" "m"
          WHERE ("m"."user_id" = "u"."id")))) AND (COALESCE("last_sign_in_at", "created_at") < ("now"() - '730 days'::interval)) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."user_purge_jobs" "upj"
          WHERE ("upj"."user_id" = "u"."id")))));


ALTER VIEW "public"."dormant_user_candidates" OWNER TO "postgres";


COMMENT ON VIEW "public"."dormant_user_candidates" IS 'Audit 2026-05-27: confirmed users with no active org membership and >730 days of inactivity, excluded if already in user_purge_jobs. Consumed exclusively by public.snapshot_dormant_users() (service_role only). security_invoker=true so anon/auth cannot bypass auth.users RLS via this view.';



CREATE TABLE IF NOT EXISTS "public"."dormant_user_purge_holds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "placed_by" "uuid",
    "reason" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."dormant_user_purge_holds" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."dormant_user_purge_holds" OWNER TO "postgres";


COMMENT ON TABLE "public"."dormant_user_purge_holds" IS 'Audit 2026-05-27 (Tier 4.4): operator-placed retention holds blocking the 36-month dormant-user purge. Active hold = no row deleted_at AND (expires_at IS NULL OR expires_at > now()). Service-role + admin-UI only.';



CREATE TABLE IF NOT EXISTS "public"."dormant_user_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshotted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "candidate_count" integer NOT NULL,
    "threshold_days" integer NOT NULL,
    "candidate_user_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[] NOT NULL,
    "notes" "text"
);

ALTER TABLE ONLY "public"."dormant_user_reviews" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."dormant_user_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "template" character varying(50) NOT NULL,
    "recipient" character varying(255) NOT NULL,
    "subject" character varying(500) NOT NULL,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "error_message" "text",
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_logs_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "email_logs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['sent'::character varying, 'failed'::character varying, 'bounced'::character varying, 'delivered'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true,
    "frequency" character varying(20) DEFAULT 'immediate'::character varying,
    "enabled_events" "jsonb" DEFAULT '[]'::"jsonb",
    "quiet_hours" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_preferences_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['immediate'::character varying, 'daily_digest'::character varying, 'weekly_digest'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flag_key" "text" NOT NULL,
    "description" "text",
    "environment" "text" DEFAULT 'production'::"text" NOT NULL,
    "scope_type" "text" DEFAULT 'global'::"text" NOT NULL,
    "scope_id" "text",
    "enabled" boolean DEFAULT false NOT NULL,
    "kill_switch" boolean DEFAULT false NOT NULL,
    "rollout_percentage" integer DEFAULT 100 NOT NULL,
    "variants" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "default_variant" "text",
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "is_public" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feature_flags_rollout_percentage_check" CHECK ((("rollout_percentage" >= 0) AND ("rollout_percentage" <= 100))),
    CONSTRAINT "feature_flags_schedule_valid" CHECK ((("end_at" IS NULL) OR ("start_at" IS NULL) OR ("end_at" > "start_at"))),
    CONSTRAINT "feature_flags_scope_consistency" CHECK (((("scope_type" = 'global'::"text") AND ("scope_id" IS NULL)) OR (("scope_type" = ANY (ARRAY['organization'::"text", 'user'::"text"])) AND ("scope_id" IS NOT NULL)))),
    CONSTRAINT "feature_flags_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['global'::"text", 'organization'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


COMMENT ON TABLE "public"."feature_flags" IS 'Runtime feature flag controls with scope + rollout + kill switch';



CREATE TABLE IF NOT EXISTS "public"."file_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "current_version" integer DEFAULT 1,
    "total_versions" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" character varying(100) NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "change_summary" "text",
    "checksum" character varying(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "data" "jsonb" NOT NULL,
    "submitted_by" "uuid",
    "submitted_by_email" "text",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{"successMessage": "Thank you for your submission!", "showProgressBar": true, "submitButtonText": "Submit", "requireAuthentication": false, "allowMultipleSubmissions": false}'::"jsonb",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "forms_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."forms" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."form_analytics" WITH ("security_invoker"='true') AS
 SELECT "f"."id" AS "form_id",
    "f"."organization_id",
    "f"."title",
    "f"."status",
    "f"."created_at",
    "count"("fr"."id") AS "response_count",
    "max"("fr"."created_at") AS "last_response_at"
   FROM ("public"."forms" "f"
     LEFT JOIN "public"."form_responses" "fr" ON (("fr"."form_id" = "f"."id")))
  GROUP BY "f"."id", "f"."organization_id", "f"."title", "f"."status", "f"."created_at";


ALTER VIEW "public"."form_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."framework_control_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "master_control_id" "uuid",
    "framework_control_id" "uuid",
    "mapping_confidence" numeric(3,2) DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_framework" "text",
    "source_control_id" "text",
    "target_framework" "text",
    "target_control_id" "text",
    "mapping_strength" "text" DEFAULT 'related'::"text",
    "notes" "text"
);


ALTER TABLE "public"."framework_control_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."framework_controls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "framework_id" "uuid" NOT NULL,
    "domain_id" "uuid" NOT NULL,
    "control_code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary_description" "text",
    "implementation_guidance" "text",
    "default_risk_level" "text",
    "review_frequency_days" integer,
    "suggested_evidence_types" "text"[],
    "suggested_automation_triggers" "text"[],
    "suggested_task_templates" "jsonb" DEFAULT '[]'::"jsonb",
    "is_deprecated" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."framework_controls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."framework_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "framework_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."framework_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."frameworks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "version" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."frameworks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."graph_nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "node_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "label" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "graph_nodes_node_type_check" CHECK (("node_type" = ANY (ARRAY['organization'::"text", 'role'::"text", 'policy'::"text", 'task'::"text", 'evidence'::"text", 'audit'::"text", 'entity'::"text"])))
);

ALTER TABLE ONLY "public"."graph_nodes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."graph_nodes" OWNER TO "postgres";


COMMENT ON TABLE "public"."graph_nodes" IS 'Audit 2026-06-01: persisted compliance-graph nodes. Derived in TypeScript by lib/compliance-graph.ts rebuildOrgGraph and UPSERTed via the service-role admin client; org members read via RLS. Append-only for authenticated.';



CREATE TABLE IF NOT EXISTS "public"."graph_wires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "from_node_id" "uuid" NOT NULL,
    "to_node_id" "uuid" NOT NULL,
    "wire_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "graph_wires_wire_type_check" CHECK (("wire_type" = ANY (ARRAY['organization_user'::"text", 'user_role'::"text", 'policy_task'::"text", 'task_evidence'::"text", 'evidence_audit'::"text"])))
);

ALTER TABLE ONLY "public"."graph_wires" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."graph_wires" OWNER TO "postgres";


COMMENT ON TABLE "public"."graph_wires" IS 'Audit 2026-06-01: persisted compliance-graph wires connecting graph_nodes. Service-role writes via rebuildOrgGraph; org members read via RLS. Append-only for authenticated.';



CREATE TABLE IF NOT EXISTS "public"."integration_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "integration_type" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "webhook_url" "text",
    "channel" character varying(255),
    "enabled" boolean DEFAULT true,
    "events" "jsonb" DEFAULT '[]'::"jsonb",
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "retry_count" integer DEFAULT 3,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_event_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "integration_id" "uuid" NOT NULL,
    "formaos_event" "text" NOT NULL,
    "integration_action" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."integration_event_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "integration_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "response_code" integer,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."integration_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."integration_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "integration_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "direction" "text" DEFAULT 'outbound'::"text" NOT NULL,
    "status" "text" DEFAULT 'success'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "integration_sync_log_direction_check" CHECK (("direction" = ANY (ARRAY['inbound'::"text", 'outbound'::"text"]))),
    CONSTRAINT "integration_sync_log_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."integration_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_hold_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "legal_hold_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legal_hold_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legal_holds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "released_by" "uuid",
    "released_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "legal_holds_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'released'::"text"])))
);


ALTER TABLE "public"."legal_holds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "environment" "text" DEFAULT 'production'::"text" NOT NULL,
    "section" "text" NOT NULL,
    "config_key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketing_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketing_config" IS 'Live marketing and site presentation controls';



CREATE TABLE IF NOT EXISTS "public"."marketing_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "organization" "text" NOT NULL,
    "industry" "text",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketing_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_controls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "control_code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "risk_level" "text" DEFAULT 'medium'::"text",
    "review_frequency_days" integer DEFAULT 90,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."master_controls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid",
    CONSTRAINT "memberships_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'employee'::"text"])))
);

ALTER TABLE ONLY "public"."memberships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."memberships" IS 'Deprecated 2026-05-24 — empty legacy table. Active membership data lives in public.org_members. Kept with strict RLS so the row never breaks future schema audits, but no application code reads or writes this table.';



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "in_app_enabled" boolean DEFAULT true,
    "email_enabled" boolean DEFAULT true,
    "policy_updates" boolean DEFAULT true,
    "evidence_updates" boolean DEFAULT true,
    "task_updates" boolean DEFAULT true,
    "security_updates" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_analytics_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_analytics_snapshots" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "criticality" "text" DEFAULT 'low'::"text",
    "owner" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    "contains_phi" boolean DEFAULT false NOT NULL,
    "encrypted_at_rest" boolean DEFAULT false NOT NULL,
    "encrypted_in_transit" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."org_assets" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "actor_role" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "action_type" "text" NOT NULL,
    "before_state" "jsonb",
    "after_state" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_audit_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "actor_email" "text" NOT NULL,
    "action" "text" NOT NULL,
    "target" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    "entity_type" "text"
);

ALTER TABLE ONLY "public"."org_audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_behaviour_support_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "participant_id" "uuid",
    "plan_type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "first_restrictive_practice_at" timestamp with time zone,
    "drafted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "authorised_at" timestamp with time zone,
    "effective_from" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    "authorising_body" "text",
    "authorisation_reference" "text",
    "sbs_provider_name" "text",
    "sbs_provider_registration_id" "text",
    "evidence_file_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_behaviour_support_plans_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['interim'::"text", 'comprehensive'::"text"]))),
    CONSTRAINT "org_behaviour_support_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'authorised'::"text", 'active'::"text", 'expired'::"text", 'withdrawn'::"text"])))
);

ALTER TABLE ONLY "public"."org_behaviour_support_plans" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_behaviour_support_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_branding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "logo_url" "text",
    "favicon_url" "text",
    "primary_color" "text" DEFAULT '#6366f1'::"text",
    "secondary_color" "text" DEFAULT '#8b5cf6'::"text",
    "custom_domain" "text",
    "login_message" "text",
    "email_footer" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_branding" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_branding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_capa_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "capa_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_id" "uuid",
    "comment" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_capa_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_capa_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_capa_events" IS 'CAPA-specific activity trail mirrored by org_audit_logs for immutable audit display.';



CREATE TABLE IF NOT EXISTS "public"."org_capa_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "incident_id" "uuid",
    "investigation_id" "uuid",
    "type" "text" DEFAULT 'corrective'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid",
    "due_date" "date",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "verification_method" "text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "effectiveness_check_date" "date",
    "effectiveness_status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_type" "text" DEFAULT 'manual'::"text",
    "source_id" "uuid",
    "severity" "text" DEFAULT 'medium'::"text",
    "owner_id" "uuid",
    "root_cause" "text",
    "corrective_action" "text",
    "preventive_action" "text",
    "verification_notes" "text",
    "closed_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    CONSTRAINT "org_capa_items_effectiveness_status_check" CHECK (("effectiveness_status" = ANY (ARRAY['pending'::"text", 'effective'::"text", 'ineffective'::"text", 'needs_revision'::"text"]))),
    CONSTRAINT "org_capa_items_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "org_capa_items_severity_check" CHECK (("severity" = ANY (ARRAY['critical'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "org_capa_items_source_type_check" CHECK (("source_type" = ANY (ARRAY['incident'::"text", 'obligation'::"text", 'policy'::"text", 'manual'::"text"]))),
    CONSTRAINT "org_capa_items_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'open'::"text", 'investigating'::"text", 'action_assigned'::"text", 'verification'::"text", 'closed'::"text", 'archived'::"text"]))),
    CONSTRAINT "org_capa_items_type_check" CHECK (("type" = ANY (ARRAY['corrective'::"text", 'preventive'::"text"])))
);

ALTER TABLE ONLY "public"."org_capa_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_capa_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_capa_items" IS 'Corrective and preventive actions with lifecycle, ownership, source links, verification, and closure metadata.';



CREATE TABLE IF NOT EXISTS "public"."org_care_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "care_plan_id" "uuid" NOT NULL,
    "participant_id" "uuid",
    "goal_text" "text" NOT NULL,
    "category" "text" DEFAULT 'independence'::"text" NOT NULL,
    "target_date" "date",
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "progress_percentage" integer DEFAULT 0,
    "measurement_method" "text",
    "baseline_value" "text",
    "target_value" "text",
    "current_value" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_care_goals_category_check" CHECK (("category" = ANY (ARRAY['daily_living'::"text", 'social'::"text", 'health'::"text", 'employment'::"text", 'education'::"text", 'community'::"text", 'independence'::"text", 'safety'::"text"]))),
    CONSTRAINT "org_care_goals_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "org_care_goals_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'achieved'::"text", 'partially_achieved'::"text", 'discontinued'::"text"])))
);

ALTER TABLE ONLY "public"."org_care_goals" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_care_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_care_plan_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "care_plan_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "snapshot_json" "jsonb" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_reason" "text"
);

ALTER TABLE ONLY "public"."org_care_plan_versions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_care_plan_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_care_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'support'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "review_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "goals" "jsonb" DEFAULT '[]'::"jsonb",
    "supports" "jsonb" DEFAULT '[]'::"jsonb",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "client_consented" boolean DEFAULT false,
    "consent_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."org_care_plans" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_care_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "framework_id" "uuid",
    "status" "text" DEFAULT 'issued'::"text" NOT NULL,
    "snapshot_hash" "text",
    "issued_at" timestamp with time zone,
    "issued_by" "uuid",
    "entity_id" "uuid",
    "reason" "text",
    "evidence_manifest" "jsonb",
    "controls_snapshot" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_certifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_compliance_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "gate_key" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "entity_id" "uuid",
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."org_compliance_blocks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_compliance_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_compliance_health_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "snapshot_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "overall_score" numeric(5,4) NOT NULL,
    "framework_count" integer NOT NULL,
    "total_controls" integer NOT NULL,
    "status_counts" "jsonb" NOT NULL,
    "frameworks" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_compliance_health_snapshots" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_compliance_health_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_compliance_health_snapshots" IS 'Audit 2026-05-27 (Tier 2.C): weekly snapshot of cross-framework health for the trend sparkline on /app/compliance/health. Service-role-only writes via /api/cron/compliance-health-snapshot.';



CREATE TABLE IF NOT EXISTS "public"."org_compliance_status" (
    "organization_id" "uuid" NOT NULL,
    "at_risk" boolean DEFAULT false NOT NULL,
    "risk_level" "text" DEFAULT 'low'::"text" NOT NULL,
    "risk_reason" "text",
    "last_framework_code" "text",
    "last_score" integer DEFAULT 0 NOT NULL,
    "last_total_controls" integer DEFAULT 0 NOT NULL,
    "last_missing_controls" integer DEFAULT 0 NOT NULL,
    "last_partial_controls" integer DEFAULT 0 NOT NULL,
    "last_evaluated_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_compliance_status_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);

ALTER TABLE ONLY "public"."org_compliance_status" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_compliance_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_control_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "framework_id" "uuid" NOT NULL,
    "compliance_score" integer DEFAULT 0 NOT NULL,
    "total_controls" integer DEFAULT 0 NOT NULL,
    "satisfied_controls" integer DEFAULT 0 NOT NULL,
    "missing_controls" integer DEFAULT 0 NOT NULL,
    "missing_control_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "partial_control_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "evaluated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "evaluated_by" "uuid",
    "snapshot_hash" "text",
    "control_type" "text",
    "control_key" "text",
    "required" boolean DEFAULT true,
    "status" "text",
    "last_evaluated_at" timestamp with time zone DEFAULT "now"(),
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    CONSTRAINT "org_control_evaluations_compliance_score_check" CHECK ((("compliance_score" >= 0) AND ("compliance_score" <= 100)))
);

ALTER TABLE ONLY "public"."org_control_evaluations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_control_evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_control_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "control_id" "uuid" NOT NULL,
    "policy_id" "uuid",
    "task_id" "uuid",
    "evidence_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_control_mappings" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_control_mappings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."org_controls" WITH ("security_invoker"='on') AS
 SELECT "ev"."id",
    "ev"."organization_id",
    "ev"."organization_id" AS "org_id",
    "ev"."status",
    "ev"."framework_id",
    "fc"."control_code" AS "code",
    "fc"."title",
    "ev"."control_key",
    "f"."slug" AS "framework",
    "ev"."required",
    "ev"."last_evaluated_at",
    "ev"."created_at",
    ( SELECT "ce"."evidence_id"
           FROM "public"."control_evidence" "ce"
          WHERE (("ce"."control_id" = "ev"."id") AND ("ce"."organization_id" = "ev"."organization_id"))
          ORDER BY "ce"."created_at" DESC
         LIMIT 1) AS "latest_evidence_id"
   FROM (("public"."org_control_evaluations" "ev"
     LEFT JOIN "public"."framework_controls" "fc" ON ((("fc"."control_code" = "ev"."control_key") AND ("fc"."framework_id" = "ev"."framework_id"))))
     LEFT JOIN "public"."frameworks" "f" ON (("f"."id" = "ev"."framework_id")));


ALTER VIEW "public"."org_controls" OWNER TO "postgres";


COMMENT ON VIEW "public"."org_controls" IS 'Audit compliance-001 (2026-05-22): SECURITY INVOKER alias view over org_control_evaluations + framework_controls + frameworks + control_evidence.';



CREATE TABLE IF NOT EXISTS "public"."org_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_entities_type_check" CHECK (("entity_type" = ANY (ARRAY['organization'::"text", 'business_unit'::"text", 'site'::"text", 'team'::"text"])))
);

ALTER TABLE ONLY "public"."org_entities" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "feature_key" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "limit_value" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_entitlements" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_entity_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_entity_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_entity_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_evidence" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "uploaded_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linked_policy_id" "uuid",
    "policy_id" "uuid",
    "entity_id" "uuid",
    "quality_score" integer,
    "risk_flag" "text",
    "ai_summary" "text",
    "last_scored_at" timestamp with time zone,
    "patient_id" "uuid",
    "title" "text",
    "file_type" "text",
    "file_size" bigint,
    "verification_status" "text" DEFAULT 'pending'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "entity_type" "text",
    "valid_from" "date",
    "valid_until" "date",
    "review_cycle_days" integer,
    "last_reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "freshness_status" "text" DEFAULT 'current'::"text",
    "file_hash" "text" NOT NULL,
    CONSTRAINT "org_evidence_freshness_status_check" CHECK (("freshness_status" = ANY (ARRAY['current'::"text", 'expiring_soon'::"text", 'expired'::"text", 'needs_review'::"text"])))
);

ALTER TABLE ONLY "public"."org_evidence" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_evidence" OWNER TO "postgres";


COMMENT ON COLUMN "public"."org_evidence"."entity_type" IS 'Entity kind that entity_id refers to: incident, capa, care_plan, staff_credential, ...';



COMMENT ON COLUMN "public"."org_evidence"."file_hash" IS 'R9 (Audit 2026-05-27): SHA-256 hex of the as-uploaded file bytes. Captured by the /api/v1/evidence/upload route; verified on demand by lib/evidence/verify-file-hash.ts. NULL for rows created before the column was added — backfill via a one-shot job.';



CREATE TABLE IF NOT EXISTS "public"."org_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "framework_code" "text",
    "snapshot_hash" "text",
    "file_path" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_exports_type_check" CHECK (("type" = 'AUDIT_BUNDLE'::"text"))
);

ALTER TABLE ONLY "public"."org_exports" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_exports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_feature_toggles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "feature_key" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_feature_toggles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_feature_toggles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "bucket_id" "text" DEFAULT 'org-files'::"text" NOT NULL,
    "object_path" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_files" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_first_session_progress" (
    "organization_id" "uuid" NOT NULL,
    "seen_steps" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_first_session_progress" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_first_session_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "submitted_by" "uuid",
    "respondent_email" "text",
    "respondent_name" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "evidence_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_form_submissions_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'reviewed'::"text", 'approved'::"text", 'rejected'::"text"])))
);

ALTER TABLE ONLY "public"."org_form_submissions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_form_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_form_submissions" IS 'Form submission responses with review workflow';



CREATE TABLE IF NOT EXISTS "public"."org_form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'custom'::"text" NOT NULL,
    "industry" "text" DEFAULT 'general'::"text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_form_templates_category_check" CHECK (("category" = ANY (ARRAY['compliance'::"text", 'risk'::"text", 'care'::"text", 'hr'::"text", 'security'::"text", 'custom'::"text"]))),
    CONSTRAINT "org_form_templates_industry_check" CHECK (("industry" = ANY (ARRAY['general'::"text", 'healthcare'::"text", 'ndis'::"text", 'fintech'::"text", 'saas'::"text"])))
);

ALTER TABLE ONLY "public"."org_form_templates" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_form_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_form_templates" IS 'Pre-built form templates for common compliance use cases';



CREATE TABLE IF NOT EXISTS "public"."org_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    CONSTRAINT "org_forms_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);

ALTER TABLE ONLY "public"."org_forms" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_forms" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_forms" IS 'Organization forms for data collection, assessments, and evidence gathering';



CREATE TABLE IF NOT EXISTS "public"."org_frameworks" (
    "organization_id" "uuid" NOT NULL,
    "framework_slug" "text" NOT NULL,
    "enabled_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_frameworks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_frameworks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_goal_progress_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "recorded_by" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "value" "text",
    "notes" "text",
    "evidence_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_goal_progress_entries" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_goal_progress_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_group_members" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_org_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_groups" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "reported_by" "uuid" NOT NULL,
    "severity" "text" DEFAULT 'low'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "incident_type" "text" DEFAULT 'general'::"text",
    "location" "text",
    "witnesses" "text"[],
    "immediate_actions" "text",
    "notifications_sent" "text"[],
    "follow_up_required" boolean DEFAULT false,
    "follow_up_due_date" "date",
    "follow_up_completed_at" timestamp with time zone,
    "root_cause" "text",
    "preventive_measures" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_incidents_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "org_incidents_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text"])))
);

ALTER TABLE ONLY "public"."org_incidents" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_industries" (
    "org_id" "uuid" NOT NULL,
    "industry_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_industries" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_industries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_synced_at" timestamp with time zone,
    "error_message" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_integrations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'paused'::"text", 'error'::"text"])))
);

ALTER TABLE ONLY "public"."org_integrations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_investigations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "incident_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'assigned'::"text" NOT NULL,
    "lead_investigator_id" "uuid",
    "team_member_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "due_date" "date",
    "findings" "text",
    "root_cause" "text",
    "contributing_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "methodology" "text",
    "evidence_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "interviews" "jsonb" DEFAULT '[]'::"jsonb",
    "recommendations" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "analysis_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "org_investigations_methodology_check" CHECK (("methodology" = ANY (ARRAY['5_whys'::"text", 'fishbone'::"text", 'timeline_analysis'::"text", 'barrier_analysis'::"text"]))),
    CONSTRAINT "org_investigations_status_check" CHECK (("status" = ANY (ARRAY['assigned'::"text", 'in_progress'::"text", 'findings_ready'::"text", 'review'::"text", 'closed'::"text"])))
);

ALTER TABLE ONLY "public"."org_investigations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_investigations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."org_investigations"."analysis_data" IS 'Methodology-specific structured RCA payload (whys/fishbone/timeline/barriers) produced by the investigation form. root_cause and contributing_factors remain in their own columns.';



CREATE TABLE IF NOT EXISTS "public"."org_invites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "token" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_invites" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_medication_administrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "medication_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "administered_by" "uuid",
    "administered_at" timestamp with time zone DEFAULT "now"(),
    "dose_given" "text",
    "status" "text" DEFAULT 'given'::"text" NOT NULL,
    "notes" "text",
    "witness_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_medication_administrations_status_check" CHECK (("status" = ANY (ARRAY['given'::"text", 'withheld'::"text", 'refused'::"text", 'self_administered'::"text"])))
);

ALTER TABLE ONLY "public"."org_medication_administrations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_medication_administrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "dosage" "text",
    "frequency" "text",
    "route" "text" DEFAULT 'oral'::"text",
    "prescribed_by" "text",
    "start_date" "date",
    "end_date" "date",
    "instructions" "text",
    "precautions" "text",
    "is_prn" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_medications_route_check" CHECK (("route" = ANY (ARRAY['oral'::"text", 'topical'::"text", 'injection'::"text", 'inhaled'::"text", 'sublingual'::"text", 'other'::"text"]))),
    CONSTRAINT "org_medications_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'discontinued'::"text", 'on_hold'::"text"])))
);

ALTER TABLE ONLY "public"."org_medications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_medications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."org_role" DEFAULT 'worker'::"public"."org_role" NOT NULL,
    "status" "public"."member_status" DEFAULT 'active'::"public"."member_status" NOT NULL,
    "invited_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_memberships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_module_entitlements" (
    "org_id" "uuid" NOT NULL,
    "module_code" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_module_entitlements" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_module_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_ndis_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "visit_id" "uuid",
    "care_plan_id" "uuid",
    "support_category" "text" NOT NULL,
    "support_item_number" "text" NOT NULL,
    "support_item_name" "text" NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "claim_type" "text" DEFAULT 'standard'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "claimed_at" timestamp with time zone,
    "payment_reference" "text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_ndis_line_items_claim_type_check" CHECK (("claim_type" = ANY (ARRAY['standard'::"text", 'cancellation'::"text", 'travel'::"text", 'non_face_to_face'::"text"]))),
    CONSTRAINT "org_ndis_line_items_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'submitted'::"text", 'paid'::"text", 'rejected'::"text"]))),
    CONSTRAINT "org_ndis_line_items_support_category_check" CHECK (("support_category" = ANY (ARRAY['core'::"text", 'capacity_building'::"text", 'capital'::"text"])))
);

ALTER TABLE ONLY "public"."org_ndis_line_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_ndis_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_ndis_price_guide" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "effective_date" "date" NOT NULL,
    "support_item_number" "text" NOT NULL,
    "support_item_name" "text" NOT NULL,
    "unit" "text",
    "price_national" numeric(10,2),
    "price_remote" numeric(10,2),
    "price_very_remote" numeric(10,2),
    "category" "text",
    "registration_group" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_ndis_price_guide" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_ndis_price_guide" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_notification_prefs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "in_app_enabled" boolean DEFAULT true NOT NULL,
    "email_enabled" boolean DEFAULT false NOT NULL,
    "policy_updates" boolean DEFAULT true NOT NULL,
    "evidence_updates" boolean DEFAULT true NOT NULL,
    "task_updates" boolean DEFAULT true NOT NULL,
    "security_updates" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_notification_prefs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_notification_prefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_notifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_onboarding_status" (
    "organization_id" "uuid" NOT NULL,
    "current_step" integer DEFAULT 1 NOT NULL,
    "completed_steps" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "first_action" "text",
    "last_completed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."org_onboarding_status" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_onboarding_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_patient_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_patient_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'completed'::"text"])))
);

ALTER TABLE ONLY "public"."org_patient_assignments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_patient_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "external_id" "text",
    "date_of_birth" "date",
    "care_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "risk_level" "text" DEFAULT 'low'::"text" NOT NULL,
    "emergency_flag" boolean DEFAULT false NOT NULL,
    "health_indicators" "jsonb",
    "flags" "jsonb",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "preferred_name" "text",
    "gender" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_relationship" "text",
    "primary_diagnosis" "text",
    "ndis_number" "text",
    "funding_type" "text",
    "plan_start_date" "date",
    "plan_end_date" "date",
    "primary_staff_id" "uuid",
    "service_types" "text"[],
    "communication_needs" "text",
    "cultural_considerations" "text",
    "allergies" "text"[],
    "medications_summary" "text",
    CONSTRAINT "org_patients_care_status_check" CHECK (("care_status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'discharged'::"text"]))),
    CONSTRAINT "org_patients_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);

ALTER TABLE ONLY "public"."org_patients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_policies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "version" "text" DEFAULT 'v0.1'::"text",
    "author" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    "required" boolean DEFAULT false NOT NULL,
    "ndis_category" "text",
    CONSTRAINT "org_policies_ndis_category_check" CHECK ((("ndis_category" IS NULL) OR ("ndis_category" = ANY (ARRAY['privacy'::"text", 'safeguarding'::"text", 'governance'::"text", 'risk_management'::"text", 'quality_management'::"text", 'information_management'::"text", 'complaints'::"text", 'incident_management'::"text", 'hr_management'::"text", 'continuity'::"text", 'access'::"text", 'service_agreements'::"text", 'transitions'::"text", 'safe_environment'::"text", 'financial_management'::"text", 'medication'::"text", 'restrictive_practices'::"text", 'worker_engagement'::"text"]))))
);

ALTER TABLE ONLY "public"."org_policies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_progress_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "staff_user_id" "uuid" NOT NULL,
    "note_text" "text" NOT NULL,
    "status_tag" "text" DEFAULT 'routine'::"text" NOT NULL,
    "signed_off_by" "uuid",
    "signed_off_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_progress_notes_signoff_check" CHECK (((("signed_off_by" IS NULL) AND ("signed_off_at" IS NULL)) OR (("signed_off_by" IS NOT NULL) AND ("signed_off_at" IS NOT NULL)))),
    CONSTRAINT "org_progress_notes_status_check" CHECK (("status_tag" = ANY (ARRAY['routine'::"text", 'follow_up'::"text", 'incident'::"text", 'risk'::"text"])))
);

ALTER TABLE ONLY "public"."org_progress_notes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_progress_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_registers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text",
    "category" "text",
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text",
    "status" "text" DEFAULT 'active'::"text",
    "risk_level" "text" DEFAULT 'low'::"text",
    "criticality" "text" DEFAULT 'medium'::"text",
    "owner_email" "text",
    CONSTRAINT "org_registers_criticality_check" CHECK (("criticality" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "org_registers_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);

ALTER TABLE ONLY "public"."org_registers" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_registers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_regulatory_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "incident_id" "uuid" NOT NULL,
    "regulation" "text" NOT NULL,
    "notification_type" "text" NOT NULL,
    "due_date" "date" NOT NULL,
    "submitted_at" timestamp with time zone,
    "submitted_by" "uuid",
    "reference_number" "text",
    "status" "text" DEFAULT 'required'::"text" NOT NULL,
    "body_name" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_regulatory_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['immediate'::"text", '5_day'::"text", 'final'::"text"]))),
    CONSTRAINT "org_regulatory_notifications_regulation_check" CHECK (("regulation" = ANY (ARRAY['ndis_sirs'::"text", 'state_health'::"text", 'aged_care_quality'::"text", 'workplace_safety'::"text", 'custom'::"text"]))),
    CONSTRAINT "org_regulatory_notifications_status_check" CHECK (("status" = ANY (ARRAY['required'::"text", 'draft'::"text", 'submitted'::"text", 'acknowledged'::"text", 'overdue'::"text"])))
);

ALTER TABLE ONLY "public"."org_regulatory_notifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_regulatory_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_report_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid",
    "org_id" "uuid" NOT NULL,
    "file_url" "text",
    "format" "text" DEFAULT 'pdf'::"text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "file_size_bytes" integer,
    "expires_at" timestamp with time zone,
    CONSTRAINT "org_report_generations_format_check" CHECK (("format" = ANY (ARRAY['pdf'::"text", 'csv'::"text", 'xlsx'::"text", 'json'::"text"])))
);

ALTER TABLE ONLY "public"."org_report_generations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_report_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_risks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "likelihood" integer NOT NULL,
    "impact" integer NOT NULL,
    "risk_score" integer GENERATED ALWAYS AS (("likelihood" * "impact")) STORED,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "mitigation_strategy" "text",
    "owner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    CONSTRAINT "org_risks_category_check" CHECK (("category" = ANY (ARRAY['security'::"text", 'compliance'::"text", 'operational'::"text", 'financial'::"text", 'reputational'::"text"]))),
    CONSTRAINT "org_risks_impact_check" CHECK ((("impact" >= 1) AND ("impact" <= 5))),
    CONSTRAINT "org_risks_likelihood_check" CHECK ((("likelihood" >= 1) AND ("likelihood" <= 5))),
    CONSTRAINT "org_risks_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'mitigated'::"text", 'accepted'::"text", 'transferred'::"text"])))
);

ALTER TABLE ONLY "public"."org_risks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_risks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_saved_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'custom'::"text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "schedule" "jsonb",
    "created_by" "uuid",
    "last_generated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "org_saved_reports_type_check" CHECK (("type" = ANY (ARRAY['custom'::"text", 'scheduled'::"text"])))
);

ALTER TABLE ONLY "public"."org_saved_reports" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_saved_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "staff_user_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "org_shifts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'complete'::"text"])))
);

ALTER TABLE ONLY "public"."org_shifts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_staff_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credential_type" "text" NOT NULL,
    "credential_name" "text" NOT NULL,
    "credential_number" "text",
    "issuing_authority" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "document_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."org_staff_credentials" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_staff_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_subscriptions" (
    "org_id" "uuid" NOT NULL,
    "plan_code" "text" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'trialing'::"public"."subscription_status" NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    "trial_started_at" timestamp with time zone,
    "trial_expires_at" timestamp with time zone,
    "price_id" "text",
    "plan_key" "text" NOT NULL,
    "payment_failures" integer DEFAULT 0,
    "grace_period_end" timestamp with time zone,
    "payment_failed_at" timestamp with time zone,
    "dispute_open" boolean DEFAULT false NOT NULL,
    "dispute_opened_at" timestamp with time zone,
    "dispute_closed_at" timestamp with time zone,
    CONSTRAINT "org_subscriptions_plan_key_check" CHECK (("plan_key" = ANY (ARRAY['basic'::"text", 'pro'::"text", 'enterprise'::"text"])))
);

ALTER TABLE ONLY "public"."org_subscriptions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."org_subscriptions"."trial_started_at" IS 'Timestamp when trial period started';



COMMENT ON COLUMN "public"."org_subscriptions"."trial_expires_at" IS 'Timestamp when trial period expires';



COMMENT ON COLUMN "public"."org_subscriptions"."price_id" IS 'Stripe price ID for the subscription';



CREATE TABLE IF NOT EXISTS "public"."org_tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "assigned_to" "text",
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "entity_id" "uuid",
    "patient_id" "uuid",
    "completed_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."org_tasks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_usage_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_usage_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "period_type" "text" NOT NULL,
    "active_users" integer DEFAULT 0,
    "total_events" integer DEFAULT 0,
    "feature_usage" "jsonb" DEFAULT '{}'::"jsonb",
    "engagement_score" numeric(5,2) DEFAULT 0,
    CONSTRAINT "org_usage_summaries_period_type_check" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);

ALTER TABLE ONLY "public"."org_usage_summaries" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_usage_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "staff_id" "uuid",
    "visit_type" "text" DEFAULT 'service'::"text" NOT NULL,
    "service_category" "text",
    "scheduled_start" timestamp with time zone NOT NULL,
    "scheduled_end" timestamp with time zone,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "cancellation_reason" "text",
    "notes" "text",
    "outcomes" "text",
    "goals_worked_on" "text"[],
    "billable" boolean DEFAULT true,
    "funding_source" "text",
    "service_code" "text",
    "location_type" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "recurrence_rule" "jsonb",
    "recurrence_parent_id" "uuid",
    "cancelled_at" timestamp with time zone,
    "location" "text",
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "travel_time_minutes" integer
);

ALTER TABLE ONLY "public"."org_visits" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "trigger_event" "text" NOT NULL,
    "trigger_data" "jsonb",
    "status" "text" NOT NULL,
    "actions_executed" integer DEFAULT 0,
    "error_message" "text",
    "executed_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_workflow_executions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_workflow_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger" "text" NOT NULL,
    "enabled" boolean DEFAULT true,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "actions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."org_workflows" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "industry_code" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "plan_key" "text",
    "plan_selected_at" timestamp with time zone,
    "industry" "text",
    "team_size" "text",
    "frameworks" "text"[],
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "onboarding_completed_at" timestamp with time zone,
    "retire_export_job_id" "uuid",
    "retire_purge_at" timestamp with time zone,
    "last_retention_at" timestamp with time zone
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organizations"."retire_export_job_id" IS 'P0-9: enterprise_export_jobs.id of the export kicked off at retire time. NULL if the export failed to enqueue (operators can re-trigger manually).';



COMMENT ON COLUMN "public"."organizations"."retire_purge_at" IS 'P0-9: moment past which this retired org becomes eligible for hard data deletion. Read by future cron purge processor; written by retireOrganizationLifecycle from ORG_RETIRE_GRACE_DAYS (default 90 days).';



COMMENT ON COLUMN "public"."organizations"."last_retention_at" IS 'Last time the data-retention cron completed a sweep for this org. Used as a round-robin cursor so the per-run org cap cannot starve later orgs (audit M8, 2026-06-01).';



CREATE TABLE IF NOT EXISTS "public"."password_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."password_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price_cents" integer,
    "currency" "text" DEFAULT 'usd'::"text",
    "features" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "email" "text",
    "ip_address" "text",
    "user_agent" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "platform_security_audit_log_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'high'::"text", 'critical'::"text"])))
);

ALTER TABLE ONLY "public"."platform_security_audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "policies_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_acknowledgments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "policy_version_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "acknowledged_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."policy_acknowledgments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "policy_version_id" "uuid" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "decision" "text",
    "comment" "text",
    "decided_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "policy_approvals_decision_check" CHECK (("decision" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."policy_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_review_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "review_frequency" "text" DEFAULT 'annual'::"text" NOT NULL,
    "next_review_date" "date" NOT NULL,
    "last_reviewed_at" timestamp with time zone,
    "reviewer_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "policy_review_schedules_review_frequency_check" CHECK (("review_frequency" = ANY (ARRAY['quarterly'::"text", 'semi_annual'::"text", 'annual'::"text", 'biennial'::"text"])))
);


ALTER TABLE "public"."policy_review_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "policy_id" "uuid" NOT NULL,
    "version_number" integer DEFAULT 1 NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "change_summary" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "policy_versions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_approval'::"text", 'approved'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."policy_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_releases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_code" "text" NOT NULL,
    "release_name" "text" NOT NULL,
    "release_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "release_date" timestamp with time zone,
    "release_notes" "text",
    "feature_flags" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "schema_version" "text",
    "ui_version" "text",
    "compatibility_min_version" "text",
    "is_locked" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_releases_release_status_check" CHECK (("release_status" = ANY (ARRAY['draft'::"text", 'stable'::"text", 'deprecated'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."product_releases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purged_subject_redactions" (
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "extra_identifiers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "purge_job_id" "uuid",
    "purged_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."purged_subject_redactions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."purged_subject_redactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."purged_subject_redactions" IS 'R1 (Audit 2026-05-27): subject identifiers captured immediately before auth.admin.deleteUser runs, so the export pipeline can redact PII out of audit rows that are retained at-rest for chain integrity. RESTRICTIVE no-UPDATE/no-DELETE policies enforce append-only.';



CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "device_name" "text",
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "push_tokens_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "blocked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rbac_permissions" (
    "key" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."rbac_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rbac_role_permissions" (
    "role_key" "text" NOT NULL,
    "permission_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rbac_role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rbac_roles" (
    "key" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."rbac_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recent_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_title" "text" DEFAULT ''::"text" NOT NULL,
    "accessed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recent_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."registers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_generations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "generated_by" "uuid",
    "format" character varying(10) NOT NULL,
    "file_path" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."report_generations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "widgets" "jsonb" DEFAULT '[]'::"jsonb",
    "layout" "jsonb" DEFAULT '{}'::"jsonb",
    "schedule" "jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."report_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "format" character varying(10) DEFAULT 'html'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restore_test_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "performed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "performed_by" "text" NOT NULL,
    "outcome" "text" NOT NULL,
    "rpo_target_minutes" integer DEFAULT 60 NOT NULL,
    "rto_target_minutes" integer DEFAULT 240 NOT NULL,
    "restored_pitr_target" "text",
    "restored_branch_id" "text",
    "duration_minutes" integer,
    "invariants_checked" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "invariants_failed" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "notes" "text",
    CONSTRAINT "restore_test_runs_outcome_check" CHECK (("outcome" = ANY (ARRAY['passed'::"text", 'failed'::"text", 'partial'::"text"]))),
    CONSTRAINT "restore_test_runs_performed_by_min_length" CHECK (("char_length"(TRIM(BOTH FROM "performed_by")) >= 3))
);

ALTER TABLE ONLY "public"."restore_test_runs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."restore_test_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."retention_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "document_category" "text" NOT NULL,
    "retention_period_days" integer NOT NULL,
    "action_on_expiry" "text" DEFAULT 'archive'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "retention_policies_action_on_expiry_check" CHECK (("action_on_expiry" = ANY (ARRAY['archive'::"text", 'delete'::"text", 'review'::"text"])))
);


ALTER TABLE "public"."retention_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."risk_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "overall_risk_score" integer NOT NULL,
    "risk_level" character varying(20) NOT NULL,
    "total_risks" integer DEFAULT 0,
    "risks_by_category" "jsonb" DEFAULT '{}'::"jsonb",
    "risks_by_severity" "jsonb" DEFAULT '{}'::"jsonb",
    "top_risks" "jsonb" DEFAULT '[]'::"jsonb",
    "trends" "jsonb" DEFAULT '{}'::"jsonb",
    "recommendations" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "risk_analyses_overall_risk_score_check" CHECK ((("overall_risk_score" >= 0) AND ("overall_risk_score" <= 100))),
    CONSTRAINT "risk_analyses_risk_level_check" CHECK ((("risk_level")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[])))
);


ALTER TABLE "public"."risk_analyses" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."risk_summary" WITH ("security_invoker"='on') AS
 SELECT "ra"."organization_id",
    "ra"."overall_risk_score",
    "ra"."risk_level",
    "ra"."total_risks",
    "ra"."created_at",
    "count"("ai"."id") AS "insight_count",
    "count"(
        CASE
            WHEN ("ai"."actionable" = true) THEN 1
            ELSE NULL::integer
        END) AS "actionable_insights"
   FROM ("public"."risk_analyses" "ra"
     LEFT JOIN "public"."ai_insights" "ai" ON (("ra"."id" = "ai"."risk_analysis_id")))
  GROUP BY "ra"."id", "ra"."organization_id", "ra"."overall_risk_score", "ra"."risk_level", "ra"."total_risks", "ra"."created_at";


ALTER VIEW "public"."risk_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "query" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "task_type" character varying(50) NOT NULL,
    "frequency" character varying(20) NOT NULL,
    "enabled" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "next_run" timestamp with time zone NOT NULL,
    "last_run" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scheduled_tasks_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::"text"[]))),
    CONSTRAINT "scheduled_tasks_task_type_check" CHECK ((("task_type")::"text" = ANY ((ARRAY['risk_analysis'::character varying, 'compliance_scan'::character varying, 'email_digest'::character varying, 'report_generation'::character varying])::"text"[])))
);


ALTER TABLE "public"."scheduled_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "query" "text" NOT NULL,
    "result_count" integer DEFAULT 0,
    "clicked_result_id" "uuid",
    "clicked_result_type" "text",
    "searched_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_index" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "search_vector" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"english"'::"regconfig", COALESCE("body", ''::"text")), 'B'::"char"))) STORED,
    "last_indexed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "search_index_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['task'::"text", 'evidence'::"text", 'control'::"text", 'policy'::"text", 'form'::"text", 'participant'::"text", 'incident'::"text", 'member'::"text", 'care_plan'::"text", 'report'::"text", 'certificate'::"text"])))
);


ALTER TABLE "public"."search_index" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."secret_rotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "secret_name" "text" NOT NULL,
    "rotated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rotated_by" "text",
    "reason" "text" NOT NULL,
    "previous_value_fingerprint" "text",
    "new_value_fingerprint" "text",
    "notes" "text",
    "ticket_url" "text",
    CONSTRAINT "secret_rotations_reason_min_length" CHECK (("char_length"(TRIM(BOTH FROM "reason")) >= 8)),
    CONSTRAINT "secret_rotations_secret_name_check" CHECK (("secret_name" = ANY (ARRAY['SUPABASE_SERVICE_ROLE_KEY'::"text", 'AUDIT_CHAIN_HMAC_KEY'::"text", 'INTEGRATION_CONFIG_KEY'::"text", 'TOTP_ENCRYPTION_KEY'::"text", 'TRUST_PACKET_SIGNING_KEY'::"text", 'EMAIL_UNSUBSCRIBE_SECRET'::"text", 'NEXTAUTH_SECRET'::"text", 'SAML_SP_PRIVATE_KEY'::"text", 'VAPID_PRIVATE_KEY'::"text", 'STRIPE_SECRET_KEY'::"text", 'STRIPE_WEBHOOK_SECRET'::"text", 'CRON_SECRET'::"text", 'PAGERDUTY_ROUTING_KEY'::"text", 'POSTHOG_PERSONAL_API_KEY'::"text", 'FIREBASE_SERVER_KEY'::"text", 'KV_REST_API_TOKEN'::"text", 'OTHER'::"text"])))
);

ALTER TABLE ONLY "public"."secret_rotations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."secret_rotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_notes" "text",
    "notes" "text",
    CONSTRAINT "security_alerts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'acknowledged'::"text", 'resolved'::"text", 'false_positive'::"text"])))
);


ALTER TABLE "public"."security_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."security_audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_fingerprint" "text",
    "geo_country" "text",
    "geo_region" "text",
    "geo_city" "text",
    "request_path" "text",
    "request_method" "text",
    "status_code" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "security_events_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "security_events_severity_check1" CHECK (("char_length"("severity") <= 20)),
    CONSTRAINT "security_events_type_check" CHECK (("type" = ANY (ARRAY['login_success'::"text", 'login_failure'::"text", 'login_mfa_required'::"text", 'logout'::"text", 'session_expired'::"text", 'token_refresh'::"text", 'password_change'::"text", 'email_change'::"text", 'mfa_enabled'::"text", 'mfa_disabled'::"text", 'brute_force_detected'::"text", 'impossible_travel'::"text", 'new_device_login'::"text", 'token_anomaly'::"text", 'fingerprint_mismatch'::"text", 'rate_limit_exceeded'::"text", 'privilege_escalation_attempt'::"text", 'unauthorized_access_attempt'::"text", 'admin_access'::"text", 'export_requested'::"text", 'bulk_delete'::"text", 'suspicious_api_pattern'::"text", 'session_revoked'::"text"]))),
    CONSTRAINT "security_events_type_check1" CHECK (("char_length"("type") <= 100))
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "environment" "text" DEFAULT 'production'::"text" NOT NULL,
    "category" "text" NOT NULL,
    "setting_key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."system_settings" IS 'Control-plane settings for ops, integrations, and runtime gates';



CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_dependencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "depends_on_task_id" "uuid" NOT NULL,
    "dependency_type" "text" DEFAULT 'blocks'::"text" NOT NULL,
    CONSTRAINT "task_dependencies_dependency_type_check" CHECK (("dependency_type" = ANY (ARRAY['blocks'::"text", 'related'::"text"])))
);


ALTER TABLE "public"."task_dependencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_recurrence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "template_task_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "frequency" "text" NOT NULL,
    "day_of_week" integer,
    "day_of_month" integer,
    "assignee_id" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "labels" "text"[] DEFAULT '{}'::"text"[],
    "next_due" timestamp with time zone NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "task_recurrence_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'biweekly'::"text", 'monthly'::"text", 'quarterly'::"text", 'annual'::"text"])))
);


ALTER TABLE "public"."task_recurrence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_time_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_minutes" integer,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_time_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "parent_team_id" "uuid",
    "lead_user_id" "uuid",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "token" "text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "accepted_by" "uuid",
    "accepted_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revoked_at" timestamp with time zone,
    CONSTRAINT "team_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'revoked'::"text"])))
);

ALTER TABLE ONLY "public"."team_invitations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "custom_role_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trust_packets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token" "text" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "generated_by" "uuid" NOT NULL,
    "recipient_email" "text",
    "note" "text",
    "packet_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "viewed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trust_packets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_org_audit_log" WITH ("security_invoker"='on') AS
 SELECT "org_audit_logs"."id",
    "org_audit_logs"."organization_id",
    "org_audit_logs"."action",
    'audit_log'::"text" AS "source_table",
    "org_audit_logs"."actor_email" AS "actor",
    "org_audit_logs"."target" AS "target_resource",
    "org_audit_logs"."entity_id",
    NULL::"jsonb" AS "before_state",
    NULL::"jsonb" AS "after_state",
    NULL::"inet" AS "ip_address",
    "org_audit_logs"."created_at"
   FROM "public"."org_audit_logs"
UNION ALL
 SELECT "org_audit_events"."id",
    "org_audit_events"."organization_id",
    "org_audit_events"."action_type" AS "action",
    'audit_event'::"text" AS "source_table",
    ("org_audit_events"."actor_user_id")::"text" AS "actor",
    "org_audit_events"."entity_type" AS "target_resource",
    "org_audit_events"."entity_id",
    "org_audit_events"."before_state",
    "org_audit_events"."after_state",
    NULL::"inet" AS "ip_address",
    "org_audit_events"."created_at"
   FROM "public"."org_audit_events"
UNION ALL
 SELECT "security_audit_log"."id",
    "security_audit_log"."organization_id",
    "security_audit_log"."event_type" AS "action",
    'security_log'::"text" AS "source_table",
    ("security_audit_log"."user_id")::"text" AS "actor",
    "security_audit_log"."event_type" AS "target_resource",
    NULL::"uuid" AS "entity_id",
    NULL::"jsonb" AS "before_state",
    "security_audit_log"."metadata" AS "after_state",
    "security_audit_log"."ip_address",
    "security_audit_log"."created_at"
   FROM "public"."security_audit_log";


ALTER VIEW "public"."unified_org_audit_log" OWNER TO "postgres";


COMMENT ON VIEW "public"."unified_org_audit_log" IS 'Unified read view across org_audit_logs, org_audit_events, and security_audit_log for compliance reporting.';



CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "route" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "user_activity_action_check" CHECK (("char_length"("action") <= 100))
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "current_organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."user_preferences" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_security" (
    "user_id" "uuid" NOT NULL,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "two_factor_enabled_at" timestamp with time zone,
    "two_factor_secret" "text",
    "backup_codes" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mfa_passed_session_id" "text",
    "mfa_passed_at" timestamp with time zone,
    "mfa_failed_attempts" integer DEFAULT 0 NOT NULL,
    "mfa_last_failure_at" timestamp with time zone,
    "backup_code_hashes" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."user_security" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_security"."backup_codes" IS 'DEPRECATED 2026-05-22 (audit auth-001). Plaintext column retained for schema-stability; new writes go to backup_code_hashes.';



COMMENT ON COLUMN "public"."user_security"."backup_code_hashes" IS 'scrypt-hashed MFA backup codes (audit auth-001, 2026-05-22).';



CREATE TABLE IF NOT EXISTS "public"."user_session_revocations" (
    "user_id" "uuid" NOT NULL,
    "revoked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_by" "uuid",
    "reason" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."user_session_revocations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_session_revocations" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_session_revocations" IS 'P0-13: per-user JWT-iat watermark. assertSessionNotRevoked rejects any access token whose iat predates revoked_at, forcing the user to refresh — which re-reads current role + membership state from the DB. Written by the admin session_revoke endpoint and on role/membership downgrades.';



CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token_hash" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_fingerprint" "text",
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "url" "text" NOT NULL,
    "events" "jsonb" DEFAULT '[]'::"jsonb",
    "secret" character varying(255) NOT NULL,
    "enabled" boolean DEFAULT true,
    "retry_count" integer DEFAULT 3,
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "webhook_id" "uuid" NOT NULL,
    "event" character varying(100) NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "response_code" integer,
    "response_body" "text",
    "error_message" "text",
    "attempts" integer DEFAULT 1,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_deliveries" OWNER TO "postgres";


ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_jobs"
    ADD CONSTRAINT "admin_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notes"
    ADD CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_document_embeddings"
    ADD CONSTRAINT "ai_document_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_index_status"
    ADD CONSTRAINT "ai_index_status_org_id_source_type_source_id_key" UNIQUE ("org_id", "source_type", "source_id");



ALTER TABLE ONLY "public"."ai_index_status"
    ADD CONSTRAINT "ai_index_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_alert_config"
    ADD CONSTRAINT "api_alert_config_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."api_alert_config"
    ADD CONSTRAINT "api_alert_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_key_usage_log"
    ADD CONSTRAINT "api_key_usage_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_key_hash_key" UNIQUE ("key_hash");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_modules"
    ADD CONSTRAINT "app_modules_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."audit_chain_anchors"
    ADD CONSTRAINT "audit_chain_anchors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_chain_secrets"
    ADD CONSTRAINT "audit_chain_secrets_pkey" PRIMARY KEY ("org_id");



ALTER TABLE ONLY "public"."audit_export_jobs"
    ADD CONSTRAINT "audit_export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_retention_config"
    ADD CONSTRAINT "audit_retention_config_org_id_key" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."audit_retention_config"
    ADD CONSTRAINT "audit_retention_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auditor_access_tokens"
    ADD CONSTRAINT "auditor_access_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auditor_access_tokens"
    ADD CONSTRAINT "auditor_access_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."auditor_activity_log"
    ADD CONSTRAINT "auditor_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_events_audit"
    ADD CONSTRAINT "billing_events_audit_event_id_event_type_key" UNIQUE ("event_id", "event_type");



ALTER TABLE ONLY "public"."billing_events_audit"
    ADD CONSTRAINT "billing_events_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_events"
    ADD CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_plans"
    ADD CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."billing_reconciliation_log"
    ADD CONSTRAINT "billing_reconciliation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_industries"
    ADD CONSTRAINT "care_industries_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."care_industries"
    ADD CONSTRAINT "care_industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_policy_templates"
    ADD CONSTRAINT "care_policy_templates_industry_id_code_version_key" UNIQUE ("industry_id", "code", "version");



ALTER TABLE ONLY "public"."care_policy_templates"
    ADD CONSTRAINT "care_policy_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_register_templates"
    ADD CONSTRAINT "care_register_templates_industry_id_code_key" UNIQUE ("industry_id", "code");



ALTER TABLE ONLY "public"."care_register_templates"
    ADD CONSTRAINT "care_register_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_service_types"
    ADD CONSTRAINT "care_service_types_industry_id_code_key" UNIQUE ("industry_id", "code");



ALTER TABLE ONLY "public"."care_service_types"
    ADD CONSTRAINT "care_service_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_task_templates"
    ADD CONSTRAINT "care_task_templates_industry_id_code_key" UNIQUE ("industry_id", "code");



ALTER TABLE ONLY "public"."care_task_templates"
    ADD CONSTRAINT "care_task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_user_id_emoji_key" UNIQUE ("comment_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_controls"
    ADD CONSTRAINT "compliance_controls_framework_id_code_key" UNIQUE ("framework_id", "code");



ALTER TABLE ONLY "public"."compliance_controls"
    ADD CONSTRAINT "compliance_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_export_jobs"
    ADD CONSTRAINT "compliance_export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_frameworks"
    ADD CONSTRAINT "compliance_frameworks_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."compliance_frameworks"
    ADD CONSTRAINT "compliance_frameworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_playbook_controls"
    ADD CONSTRAINT "compliance_playbook_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_playbook_controls"
    ADD CONSTRAINT "compliance_playbook_controls_playbook_id_control_id_key" UNIQUE ("playbook_id", "control_id");



ALTER TABLE ONLY "public"."compliance_playbooks"
    ADD CONSTRAINT "compliance_playbooks_framework_id_name_key" UNIQUE ("framework_id", "name");



ALTER TABLE ONLY "public"."compliance_playbooks"
    ADD CONSTRAINT "compliance_playbooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_scans"
    ADD CONSTRAINT "compliance_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_scans"
    ADD CONSTRAINT "compliance_scans_scan_id_key" UNIQUE ("scan_id");



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_organization_id_framework_slug_s_key" UNIQUE ("organization_id", "framework_slug", "snapshot_date");



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_evidence"
    ADD CONSTRAINT "control_evidence_organization_id_control_id_evidence_id_key" UNIQUE ("organization_id", "control_id", "evidence_id");



ALTER TABLE ONLY "public"."control_evidence"
    ADD CONSTRAINT "control_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_group_members"
    ADD CONSTRAINT "control_group_members_group_id_framework_control_id_key" UNIQUE ("group_id", "framework", "control_id");



ALTER TABLE ONLY "public"."control_group_members"
    ADD CONSTRAINT "control_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_groups"
    ADD CONSTRAINT "control_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_mappings"
    ADD CONSTRAINT "control_mappings_internal_control_id_framework_slug_externa_key" UNIQUE ("internal_control_id", "framework_slug", "external_control_reference");



ALTER TABLE ONLY "public"."control_mappings"
    ADD CONSTRAINT "control_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."control_tasks"
    ADD CONSTRAINT "control_tasks_organization_id_control_id_task_id_key" UNIQUE ("organization_id", "control_id", "task_id");



ALTER TABLE ONLY "public"."control_tasks"
    ADD CONSTRAINT "control_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_org_id_name_key" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."custom_roles"
    ADD CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_widget_id_key" UNIQUE ("widget_id");



ALTER TABLE ONLY "public"."dashboard_widget_registry"
    ADD CONSTRAINT "dashboard_widget_registry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widget_registry"
    ADD CONSTRAINT "dashboard_widget_registry_widget_key_key" UNIQUE ("widget_key");



ALTER TABLE ONLY "public"."document_lifecycle_log"
    ADD CONSTRAINT "document_lifecycle_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dormant_user_purge_holds"
    ADD CONSTRAINT "dormant_user_purge_holds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dormant_user_reviews"
    ADD CONSTRAINT "dormant_user_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."enterprise_export_jobs"
    ADD CONSTRAINT "enterprise_export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_metadata"
    ADD CONSTRAINT "file_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_versions"
    ADD CONSTRAINT "file_versions_file_id_version_number_key" UNIQUE ("file_id", "version_number");



ALTER TABLE ONLY "public"."file_versions"
    ADD CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."framework_control_mappings"
    ADD CONSTRAINT "framework_control_mappings_master_control_id_framework_cont_key" UNIQUE ("master_control_id", "framework_control_id");



ALTER TABLE ONLY "public"."framework_control_mappings"
    ADD CONSTRAINT "framework_control_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."framework_controls"
    ADD CONSTRAINT "framework_controls_framework_id_control_code_key" UNIQUE ("framework_id", "control_code");



ALTER TABLE ONLY "public"."framework_controls"
    ADD CONSTRAINT "framework_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."framework_domains"
    ADD CONSTRAINT "framework_domains_framework_id_name_key" UNIQUE ("framework_id", "name");



ALTER TABLE ONLY "public"."framework_domains"
    ADD CONSTRAINT "framework_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frameworks"
    ADD CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frameworks"
    ADD CONSTRAINT "frameworks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."graph_nodes"
    ADD CONSTRAINT "graph_nodes_organization_id_node_type_source_id_key" UNIQUE ("organization_id", "node_type", "source_id");



ALTER TABLE ONLY "public"."graph_nodes"
    ADD CONSTRAINT "graph_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."graph_wires"
    ADD CONSTRAINT "graph_wires_organization_id_wire_type_from_node_id_to_node__key" UNIQUE ("organization_id", "wire_type", "from_node_id", "to_node_id");



ALTER TABLE ONLY "public"."graph_wires"
    ADD CONSTRAINT "graph_wires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_configs"
    ADD CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_event_mappings"
    ADD CONSTRAINT "integration_event_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_events"
    ADD CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integration_sync_log"
    ADD CONSTRAINT "integration_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_hold_documents"
    ADD CONSTRAINT "legal_hold_documents_legal_hold_id_document_id_key" UNIQUE ("legal_hold_id", "document_id");



ALTER TABLE ONLY "public"."legal_hold_documents"
    ADD CONSTRAINT "legal_hold_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_holds"
    ADD CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_config"
    ADD CONSTRAINT "marketing_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_leads"
    ADD CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_controls"
    ADD CONSTRAINT "master_controls_control_code_key" UNIQUE ("control_code");



ALTER TABLE ONLY "public"."master_controls"
    ADD CONSTRAINT "master_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."org_analytics_snapshots"
    ADD CONSTRAINT "org_analytics_snapshots_org_id_snapshot_date_key" UNIQUE ("org_id", "snapshot_date");



ALTER TABLE ONLY "public"."org_analytics_snapshots"
    ADD CONSTRAINT "org_analytics_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_assets"
    ADD CONSTRAINT "org_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."org_assets"
    ADD CONSTRAINT "org_assets_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'maintenance'::"text", 'retired'::"text", 'archived'::"text"]))) NOT VALID;



ALTER TABLE ONLY "public"."org_audit_events"
    ADD CONSTRAINT "org_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_audit_logs"
    ADD CONSTRAINT "org_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_behaviour_support_plans"
    ADD CONSTRAINT "org_behaviour_support_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_branding"
    ADD CONSTRAINT "org_branding_org_id_key" UNIQUE ("org_id");



ALTER TABLE ONLY "public"."org_branding"
    ADD CONSTRAINT "org_branding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_capa_events"
    ADD CONSTRAINT "org_capa_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_capa_items"
    ADD CONSTRAINT "org_capa_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_care_goals"
    ADD CONSTRAINT "org_care_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_care_plan_versions"
    ADD CONSTRAINT "org_care_plan_versions_care_plan_id_version_number_key" UNIQUE ("care_plan_id", "version_number");



ALTER TABLE ONLY "public"."org_care_plan_versions"
    ADD CONSTRAINT "org_care_plan_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_care_plans"
    ADD CONSTRAINT "org_care_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_certifications"
    ADD CONSTRAINT "org_certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_compliance_blocks"
    ADD CONSTRAINT "org_compliance_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_compliance_health_snapshots"
    ADD CONSTRAINT "org_compliance_health_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_compliance_status"
    ADD CONSTRAINT "org_compliance_status_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."org_control_evaluations"
    ADD CONSTRAINT "org_control_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_organization_id_control_id_policy_id_t_key" UNIQUE ("organization_id", "control_id", "policy_id", "task_id", "evidence_id");



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_credentials"
    ADD CONSTRAINT "org_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_entities"
    ADD CONSTRAINT "org_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_entitlements"
    ADD CONSTRAINT "org_entitlements_organization_id_feature_key_key" UNIQUE ("organization_id", "feature_key");



ALTER TABLE ONLY "public"."org_entitlements"
    ADD CONSTRAINT "org_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_entity_members"
    ADD CONSTRAINT "org_entity_members_entity_id_user_id_key" UNIQUE ("entity_id", "user_id");



ALTER TABLE ONLY "public"."org_entity_members"
    ADD CONSTRAINT "org_entity_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_exports"
    ADD CONSTRAINT "org_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_feature_toggles"
    ADD CONSTRAINT "org_feature_toggles_org_id_feature_key_key" UNIQUE ("org_id", "feature_key");



ALTER TABLE ONLY "public"."org_feature_toggles"
    ADD CONSTRAINT "org_feature_toggles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_files"
    ADD CONSTRAINT "org_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_first_session_progress"
    ADD CONSTRAINT "org_first_session_progress_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."org_form_submissions"
    ADD CONSTRAINT "org_form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_form_templates"
    ADD CONSTRAINT "org_form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_forms"
    ADD CONSTRAINT "org_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_forms"
    ADD CONSTRAINT "org_forms_slug_org_unique" UNIQUE ("org_id", "slug");



ALTER TABLE ONLY "public"."org_frameworks"
    ADD CONSTRAINT "org_frameworks_pkey" PRIMARY KEY ("organization_id", "framework_slug");



ALTER TABLE ONLY "public"."org_goal_progress_entries"
    ADD CONSTRAINT "org_goal_progress_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_group_members"
    ADD CONSTRAINT "org_group_members_group_id_organization_id_key" UNIQUE ("group_id", "organization_id");



ALTER TABLE ONLY "public"."org_group_members"
    ADD CONSTRAINT "org_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_groups"
    ADD CONSTRAINT "org_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_incidents"
    ADD CONSTRAINT "org_incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_industries"
    ADD CONSTRAINT "org_industries_pkey" PRIMARY KEY ("org_id", "industry_id");



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_org_id_provider_key" UNIQUE ("org_id", "provider");



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_investigations"
    ADD CONSTRAINT "org_investigations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_medication_administrations"
    ADD CONSTRAINT "org_medication_administrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_medications"
    ADD CONSTRAINT "org_medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_org_id_user_id_key" UNIQUE ("org_id", "user_id");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_module_entitlements"
    ADD CONSTRAINT "org_module_entitlements_pkey" PRIMARY KEY ("org_id", "module_code");



ALTER TABLE ONLY "public"."org_ndis_line_items"
    ADD CONSTRAINT "org_ndis_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_ndis_price_guide"
    ADD CONSTRAINT "org_ndis_price_guide_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_notification_prefs"
    ADD CONSTRAINT "org_notification_prefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_notification_prefs"
    ADD CONSTRAINT "org_notification_prefs_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."org_notifications"
    ADD CONSTRAINT "org_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_onboarding_status"
    ADD CONSTRAINT "org_onboarding_status_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."org_patient_assignments"
    ADD CONSTRAINT "org_patient_assignments_organization_id_patient_id_user_id_key" UNIQUE ("organization_id", "patient_id", "user_id");



ALTER TABLE ONLY "public"."org_patient_assignments"
    ADD CONSTRAINT "org_patient_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_patients"
    ADD CONSTRAINT "org_patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_policies"
    ADD CONSTRAINT "org_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."org_policies"
    ADD CONSTRAINT "org_policies_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'review'::"text", 'pending_approval'::"text", 'approved'::"text", 'published'::"text", 'archived'::"text"]))) NOT VALID;



ALTER TABLE ONLY "public"."org_progress_notes"
    ADD CONSTRAINT "org_progress_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_registers"
    ADD CONSTRAINT "org_registers_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."org_registers"
    ADD CONSTRAINT "org_registers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_regulatory_notifications"
    ADD CONSTRAINT "org_regulatory_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_report_generations"
    ADD CONSTRAINT "org_report_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_risks"
    ADD CONSTRAINT "org_risks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_saved_reports"
    ADD CONSTRAINT "org_saved_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_settings"
    ADD CONSTRAINT "org_settings_organization_id_key_key" UNIQUE ("organization_id", "key");



ALTER TABLE ONLY "public"."org_settings"
    ADD CONSTRAINT "org_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_shifts"
    ADD CONSTRAINT "org_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_organization_id_user_id_credential_ty_key" UNIQUE ("organization_id", "user_id", "credential_type", "credential_number");



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'rejected'::"text", 'expired'::"text", 'archived'::"text"]))) NOT VALID;



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_pkey" PRIMARY KEY ("org_id");



ALTER TABLE ONLY "public"."org_tasks"
    ADD CONSTRAINT "org_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."org_tasks"
    ADD CONSTRAINT "org_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'open'::"text", 'in_progress'::"text", 'blocked'::"text", 'completed'::"text", 'cancelled'::"text", 'canceled'::"text"]))) NOT VALID;



ALTER TABLE ONLY "public"."org_usage_events"
    ADD CONSTRAINT "org_usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_usage_summaries"
    ADD CONSTRAINT "org_usage_summaries_org_id_period_start_period_type_key" UNIQUE ("org_id", "period_start", "period_type");



ALTER TABLE ONLY "public"."org_usage_summaries"
    ADD CONSTRAINT "org_usage_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_workflow_executions"
    ADD CONSTRAINT "org_workflow_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_workflows"
    ADD CONSTRAINT "org_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_history"
    ADD CONSTRAINT "password_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_security_audit_log"
    ADD CONSTRAINT "platform_security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_acknowledgments"
    ADD CONSTRAINT "policy_acknowledgments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_acknowledgments"
    ADD CONSTRAINT "policy_acknowledgments_policy_version_id_user_id_key" UNIQUE ("policy_version_id", "user_id");



ALTER TABLE ONLY "public"."policy_approvals"
    ADD CONSTRAINT "policy_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_review_schedules"
    ADD CONSTRAINT "policy_review_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_policy_version_unique" UNIQUE ("policy_id", "version_number");



ALTER TABLE ONLY "public"."product_releases"
    ADD CONSTRAINT "product_releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_releases"
    ADD CONSTRAINT "product_releases_version_code_key" UNIQUE ("version_code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purged_subject_redactions"
    ADD CONSTRAINT "purged_subject_redactions_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."rate_limit_log"
    ADD CONSTRAINT "rate_limit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rbac_permissions"
    ADD CONSTRAINT "rbac_permissions_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."rbac_role_permissions"
    ADD CONSTRAINT "rbac_role_permissions_pkey" PRIMARY KEY ("role_key", "permission_key");



ALTER TABLE ONLY "public"."rbac_roles"
    ADD CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."recent_items"
    ADD CONSTRAINT "recent_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registers"
    ADD CONSTRAINT "registers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_export_jobs"
    ADD CONSTRAINT "report_export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_generations"
    ADD CONSTRAINT "report_generations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restore_test_runs"
    ADD CONSTRAINT "restore_test_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retention_policies"
    ADD CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."risk_analyses"
    ADD CONSTRAINT "risk_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scan_findings"
    ADD CONSTRAINT "scan_findings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_tasks"
    ADD CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_index"
    ADD CONSTRAINT "search_index_org_id_entity_type_entity_id_key" UNIQUE ("org_id", "entity_type", "entity_id");



ALTER TABLE ONLY "public"."search_index"
    ADD CONSTRAINT "search_index_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."secret_rotations"
    ADD CONSTRAINT "secret_rotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_alerts"
    ADD CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_requests"
    ADD CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_dependencies"
    ADD CONSTRAINT "task_dependencies_task_id_depends_on_task_id_key" UNIQUE ("task_id", "depends_on_task_id");



ALTER TABLE ONLY "public"."task_recurrence"
    ADD CONSTRAINT "task_recurrence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_time_entries"
    ADD CONSTRAINT "task_time_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_groups"
    ADD CONSTRAINT "team_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."trust_packets"
    ADD CONSTRAINT "trust_packets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trust_packets"
    ADD CONSTRAINT "trust_packets_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_purge_jobs"
    ADD CONSTRAINT "user_purge_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_security"
    ADD CONSTRAINT "user_security_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_session_revocations"
    ADD CONSTRAINT "user_session_revocations_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_configs"
    ADD CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_audit_log_actor_idx" ON "public"."admin_audit_log" USING "btree" ("actor_user_id");



CREATE INDEX "admin_audit_log_target_idx" ON "public"."admin_audit_log" USING "btree" ("target_type", "target_id");



CREATE INDEX "admin_jobs_status_created_idx" ON "public"."admin_jobs" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "admin_jobs_type_created_idx" ON "public"."admin_jobs" USING "btree" ("job_type", "created_at" DESC);



CREATE INDEX "admin_jobs_updated_idx" ON "public"."admin_jobs" USING "btree" ("updated_at" DESC);



CREATE INDEX "admin_notes_org_id_idx" ON "public"."admin_notes" USING "btree" ("org_id");



CREATE INDEX "admin_notes_user_id_idx" ON "public"."admin_notes" USING "btree" ("user_id");



CREATE INDEX "audit_chain_anchors_org_anchored_at_idx" ON "public"."audit_chain_anchors" USING "btree" ("org_id", "anchored_at" DESC);



CREATE INDEX "audit_chain_anchors_top_hash_idx" ON "public"."audit_chain_anchors" USING "btree" ("top_entry_hash");



CREATE INDEX "audit_log_actor_idx" ON "public"."audit_log" USING "btree" ("actor_user_id", "created_at" DESC);



CREATE INDEX "audit_log_created_idx" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "audit_log_event_idx" ON "public"."audit_log" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "audit_log_org_created_at_idx" ON "public"."audit_log" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "audit_log_target_idx" ON "public"."audit_log" USING "btree" ("target_type", "target_id", "created_at" DESC);



CREATE INDEX "billing_events_status_idx" ON "public"."billing_events" USING "btree" ("status", "started_at");



CREATE INDEX "compliance_controls_framework_control_idx" ON "public"."compliance_controls" USING "btree" ("framework_control_id");



CREATE INDEX "compliance_controls_framework_id_idx" ON "public"."compliance_controls" USING "btree" ("framework_id");



CREATE INDEX "compliance_export_jobs_queue_idx" ON "public"."compliance_export_jobs" USING "btree" ("status", "next_run_at", "created_at");



CREATE INDEX "control_evidence_org_control_idx" ON "public"."control_evidence" USING "btree" ("organization_id", "control_id");



CREATE INDEX "control_mappings_framework_slug_idx" ON "public"."control_mappings" USING "btree" ("framework_slug");



CREATE INDEX "control_mappings_internal_control_idx" ON "public"."control_mappings" USING "btree" ("internal_control_id");



CREATE INDEX "control_tasks_org_control_idx" ON "public"."control_tasks" USING "btree" ("organization_id", "control_id");



CREATE INDEX "dormant_user_purge_holds_user_idx" ON "public"."dormant_user_purge_holds" USING "btree" ("user_id");



CREATE INDEX "dormant_user_reviews_snapshotted_at_idx" ON "public"."dormant_user_reviews" USING "btree" ("snapshotted_at" DESC);



CREATE INDEX "export_jobs_org_idx" ON "public"."compliance_export_jobs" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "export_jobs_status_idx" ON "public"."compliance_export_jobs" USING "btree" ("status", "created_at");



CREATE INDEX "feature_flags_lookup_idx" ON "public"."feature_flags" USING "btree" ("environment", "flag_key", "scope_type", "scope_id");



CREATE UNIQUE INDEX "feature_flags_unique_scope_idx" ON "public"."feature_flags" USING "btree" ("environment", "flag_key", "scope_type", COALESCE("scope_id", ''::"text"));



CREATE INDEX "feature_flags_updated_idx" ON "public"."feature_flags" USING "btree" ("updated_at" DESC);



CREATE INDEX "framework_controls_domain_id_idx" ON "public"."framework_controls" USING "btree" ("domain_id");



CREATE INDEX "framework_controls_framework_id_idx" ON "public"."framework_controls" USING "btree" ("framework_id");



CREATE INDEX "framework_domains_framework_id_idx" ON "public"."framework_domains" USING "btree" ("framework_id");



CREATE INDEX "framework_mappings_framework_idx" ON "public"."framework_control_mappings" USING "btree" ("framework_control_id");



CREATE INDEX "framework_mappings_master_idx" ON "public"."framework_control_mappings" USING "btree" ("master_control_id");



CREATE INDEX "graph_nodes_org_source_idx" ON "public"."graph_nodes" USING "btree" ("organization_id", "source_id");



CREATE INDEX "graph_nodes_org_type_idx" ON "public"."graph_nodes" USING "btree" ("organization_id", "node_type");



CREATE INDEX "graph_wires_org_from_idx" ON "public"."graph_wires" USING "btree" ("organization_id", "from_node_id");



CREATE INDEX "graph_wires_org_to_idx" ON "public"."graph_wires" USING "btree" ("organization_id", "to_node_id");



CREATE INDEX "idx_active_sessions_active" ON "public"."active_sessions" USING "btree" ("user_id", "revoked_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_active_sessions_last_seen" ON "public"."active_sessions" USING "btree" ("last_seen_at" DESC);



CREATE INDEX "idx_active_sessions_org_id" ON "public"."active_sessions" USING "btree" ("org_id") WHERE ("org_id" IS NOT NULL);



CREATE INDEX "idx_active_sessions_user_id" ON "public"."active_sessions" USING "btree" ("user_id", "last_seen_at" DESC);



CREATE INDEX "idx_ai_embeddings_hnsw" ON "public"."ai_document_embeddings" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_ai_embeddings_org" ON "public"."ai_document_embeddings" USING "btree" ("org_id");



CREATE INDEX "idx_ai_embeddings_source" ON "public"."ai_document_embeddings" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_ai_index_status_org" ON "public"."ai_index_status" USING "btree" ("org_id", "source_type");



CREATE INDEX "idx_ai_insights_org" ON "public"."ai_insights" USING "btree" ("organization_id");



CREATE INDEX "idx_ai_insights_risk" ON "public"."ai_insights" USING "btree" ("risk_analysis_id");



CREATE INDEX "idx_ai_insights_type" ON "public"."ai_insights" USING "btree" ("type");



CREATE INDEX "idx_ai_usage_org" ON "public"."ai_usage_log" USING "btree" ("org_id", "created_at");



CREATE INDEX "idx_ai_usage_user" ON "public"."ai_usage_log" USING "btree" ("org_id", "user_id", "created_at");



CREATE INDEX "idx_api_alert_config_org" ON "public"."api_alert_config" USING "btree" ("organization_id");



CREATE INDEX "idx_api_key_usage_log_api_key_id" ON "public"."api_key_usage_log" USING "btree" ("api_key_id", "created_at" DESC);



CREATE INDEX "idx_api_key_usage_log_org_id" ON "public"."api_key_usage_log" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_api_keys_key_hash" ON "public"."api_keys" USING "btree" ("key_hash");



CREATE INDEX "idx_api_keys_org_id" ON "public"."api_keys" USING "btree" ("org_id");



CREATE INDEX "idx_api_usage_logs_endpoint" ON "public"."api_usage_logs" USING "btree" ("endpoint");



CREATE INDEX "idx_api_usage_logs_org" ON "public"."api_usage_logs" USING "btree" ("organization_id");



CREATE INDEX "idx_api_usage_logs_org_timestamp" ON "public"."api_usage_logs" USING "btree" ("organization_id", "timestamp" DESC);



CREATE INDEX "idx_api_usage_logs_status" ON "public"."api_usage_logs" USING "btree" ("status_code");



CREATE INDEX "idx_api_usage_logs_timestamp" ON "public"."api_usage_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_api_usage_logs_user" ON "public"."api_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_audit_exports_org" ON "public"."audit_export_jobs" USING "btree" ("org_id");



CREATE INDEX "idx_audit_log_created" ON "public"."audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_audit_log_org" ON "public"."audit_log" USING "btree" ("org_id");



CREATE INDEX "idx_audit_log_resource" ON "public"."audit_log" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_auditor_activity_org" ON "public"."auditor_activity_log" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_auditor_activity_token" ON "public"."auditor_activity_log" USING "btree" ("token_id");



CREATE INDEX "idx_auditor_tokens_hash" ON "public"."auditor_access_tokens" USING "btree" ("token_hash");



CREATE INDEX "idx_auditor_tokens_org" ON "public"."auditor_access_tokens" USING "btree" ("org_id");



CREATE INDEX "idx_billing_events_audit_org" ON "public"."billing_events_audit" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_billing_events_audit_stripe_customer" ON "public"."billing_events_audit" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_billing_reconciliation_org" ON "public"."billing_reconciliation_log" USING "btree" ("organization_id", "checked_at" DESC);



CREATE INDEX "idx_billing_reconciliation_unfixed" ON "public"."billing_reconciliation_log" USING "btree" ("auto_fixed") WHERE ("auto_fixed" = false);



CREATE INDEX "idx_capa_assigned" ON "public"."org_capa_items" USING "btree" ("assigned_to");



CREATE INDEX "idx_capa_events_org_capa" ON "public"."org_capa_events" USING "btree" ("organization_id", "capa_id", "created_at" DESC);



CREATE INDEX "idx_capa_events_org_type" ON "public"."org_capa_events" USING "btree" ("organization_id", "event_type", "created_at" DESC);



CREATE INDEX "idx_capa_incident" ON "public"."org_capa_items" USING "btree" ("incident_id");



CREATE INDEX "idx_capa_org" ON "public"."org_capa_items" USING "btree" ("organization_id");



CREATE INDEX "idx_capa_org_due_date" ON "public"."org_capa_items" USING "btree" ("organization_id", "due_date");



CREATE INDEX "idx_capa_org_owner" ON "public"."org_capa_items" USING "btree" ("organization_id", "owner_id");



CREATE INDEX "idx_capa_org_source" ON "public"."org_capa_items" USING "btree" ("organization_id", "source_type", "source_id");



CREATE INDEX "idx_capa_org_status" ON "public"."org_capa_items" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_capa_status" ON "public"."org_capa_items" USING "btree" ("status");



CREATE INDEX "idx_care_goals_participant" ON "public"."org_care_goals" USING "btree" ("participant_id");



CREATE INDEX "idx_care_goals_plan" ON "public"."org_care_goals" USING "btree" ("care_plan_id");



CREATE INDEX "idx_care_goals_status" ON "public"."org_care_goals" USING "btree" ("status");



CREATE INDEX "idx_care_plans_client" ON "public"."org_care_plans" USING "btree" ("client_id");



CREATE INDEX "idx_care_plans_org" ON "public"."org_care_plans" USING "btree" ("organization_id");



CREATE INDEX "idx_care_plans_review" ON "public"."org_care_plans" USING "btree" ("review_date");



CREATE INDEX "idx_care_plans_status" ON "public"."org_care_plans" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_comment_reactions_comment" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comments_content_search" ON "public"."comments" USING "gin" ("to_tsvector"('"english"'::"regconfig", "content"));



CREATE INDEX "idx_comments_created" ON "public"."comments" USING "btree" ("created_at");



CREATE INDEX "idx_comments_entity" ON "public"."comments" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_comments_org" ON "public"."comments" USING "btree" ("organization_id");



CREATE INDEX "idx_comments_parent" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_user" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_compliance_controls_framework_code" ON "public"."compliance_controls" USING "btree" ("framework_id", "code");



CREATE INDEX "idx_compliance_controls_is_deprecated" ON "public"."compliance_controls" USING "btree" ("framework_id", "is_deprecated");



CREATE INDEX "idx_compliance_frameworks_code" ON "public"."compliance_frameworks" USING "btree" ("code");



CREATE INDEX "idx_compliance_scans_completed" ON "public"."compliance_scans" USING "btree" ("completed_at" DESC);



CREATE INDEX "idx_compliance_scans_findings" ON "public"."compliance_scans" USING "gin" ("findings");



CREATE INDEX "idx_compliance_scans_framework" ON "public"."compliance_scans" USING "btree" ("framework");



CREATE INDEX "idx_compliance_scans_org" ON "public"."compliance_scans" USING "btree" ("organization_id");



CREATE INDEX "idx_compliance_scans_org_framework" ON "public"."compliance_scans" USING "btree" ("organization_id", "framework");



CREATE INDEX "idx_compliance_scans_score" ON "public"."compliance_scans" USING "btree" ("compliance_score");



CREATE INDEX "idx_control_evidence_control" ON "public"."control_evidence" USING "btree" ("organization_id", "control_id", "status");



CREATE INDEX "idx_control_evidence_evidence" ON "public"."control_evidence" USING "btree" ("organization_id", "evidence_id", "status");



CREATE INDEX "idx_controls_framework" ON "public"."compliance_controls" USING "btree" ("framework_id");



CREATE INDEX "idx_controls_framework_code" ON "public"."compliance_controls" USING "btree" ("framework_id", "code");



CREATE INDEX "idx_crossmap_source" ON "public"."framework_control_mappings" USING "btree" ("source_framework", "source_control_id");



CREATE INDEX "idx_crossmap_target" ON "public"."framework_control_mappings" USING "btree" ("target_framework", "target_control_id");



CREATE INDEX "idx_custom_roles_org" ON "public"."custom_roles" USING "btree" ("org_id");



CREATE INDEX "idx_dashboard_layouts_enabled" ON "public"."dashboard_layouts" USING "btree" ("enabled");



CREATE INDEX "idx_dashboard_layouts_org" ON "public"."dashboard_layouts" USING "btree" ("organization_id");



CREATE INDEX "idx_dashboard_layouts_settings" ON "public"."dashboard_layouts" USING "gin" ("settings");



CREATE INDEX "idx_dashboard_layouts_type" ON "public"."dashboard_layouts" USING "btree" ("widget_type");



CREATE INDEX "idx_dashboard_layouts_user" ON "public"."dashboard_layouts" USING "btree" ("user_id", "org_id");



CREATE INDEX "idx_doc_lifecycle_doc" ON "public"."document_lifecycle_log" USING "btree" ("document_id");



CREATE INDEX "idx_doc_lifecycle_org" ON "public"."document_lifecycle_log" USING "btree" ("org_id");



CREATE INDEX "idx_email_logs_org" ON "public"."email_logs" USING "btree" ("organization_id");



CREATE INDEX "idx_email_logs_org_sent" ON "public"."email_logs" USING "btree" ("organization_id", "sent_at" DESC);



CREATE INDEX "idx_email_logs_sent" ON "public"."email_logs" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_email_logs_status" ON "public"."email_logs" USING "btree" ("status");



CREATE INDEX "idx_email_logs_user" ON "public"."email_logs" USING "btree" ("user_id");



CREATE INDEX "idx_email_preferences_org" ON "public"."email_preferences" USING "btree" ("organization_id");



CREATE INDEX "idx_email_preferences_user" ON "public"."email_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_enterprise_export_active" ON "public"."enterprise_export_jobs" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text"]));



CREATE INDEX "idx_enterprise_export_org" ON "public"."enterprise_export_jobs" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_evals_org_framework_time" ON "public"."org_control_evaluations" USING "btree" ("organization_id", "framework_id", "evaluated_at" DESC);



CREATE INDEX "idx_event_mappings_integration" ON "public"."integration_event_mappings" USING "btree" ("integration_id");



CREATE INDEX "idx_evidence_freshness" ON "public"."org_evidence" USING "btree" ("organization_id", "freshness_status");



CREATE INDEX "idx_feature_toggles_org" ON "public"."org_feature_toggles" USING "btree" ("org_id");



CREATE INDEX "idx_file_metadata_entity" ON "public"."file_metadata" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_file_metadata_org" ON "public"."file_metadata" USING "btree" ("organization_id");



CREATE INDEX "idx_file_versions_file" ON "public"."file_versions" USING "btree" ("file_id");



CREATE INDEX "idx_file_versions_file_version" ON "public"."file_versions" USING "btree" ("file_id", "version_number" DESC);



CREATE INDEX "idx_file_versions_uploaded" ON "public"."file_versions" USING "btree" ("uploaded_by");



CREATE INDEX "idx_file_versions_version" ON "public"."file_versions" USING "btree" ("version_number");



CREATE INDEX "idx_form_responses_created" ON "public"."form_responses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_form_responses_form" ON "public"."form_responses" USING "btree" ("form_id");



CREATE INDEX "idx_form_responses_org" ON "public"."form_responses" USING "btree" ("organization_id");



CREATE INDEX "idx_form_responses_submitted_by" ON "public"."form_responses" USING "btree" ("submitted_by");



CREATE INDEX "idx_forms_org" ON "public"."forms" USING "btree" ("organization_id");



CREATE INDEX "idx_forms_status" ON "public"."forms" USING "btree" ("status");



CREATE INDEX "idx_framework_controls_is_deprecated" ON "public"."framework_controls" USING "btree" ("framework_id", "is_deprecated");



CREATE INDEX "idx_goal_progress_goal" ON "public"."org_goal_progress_entries" USING "btree" ("goal_id");



CREATE INDEX "idx_integration_configs_org" ON "public"."integration_configs" USING "btree" ("organization_id");



CREATE INDEX "idx_integration_configs_type" ON "public"."integration_configs" USING "btree" ("integration_type");



CREATE INDEX "idx_integration_events_created" ON "public"."integration_events" USING "btree" ("created_at");



CREATE INDEX "idx_integration_events_integration" ON "public"."integration_events" USING "btree" ("integration_id");



CREATE INDEX "idx_integration_events_org" ON "public"."integration_events" USING "btree" ("organization_id");



CREATE INDEX "idx_integration_events_org_type" ON "public"."integration_events" USING "btree" ("organization_id", "event_type");



CREATE INDEX "idx_investigations_incident" ON "public"."org_investigations" USING "btree" ("incident_id");



CREATE INDEX "idx_investigations_org" ON "public"."org_investigations" USING "btree" ("organization_id");



CREATE INDEX "idx_investigations_status" ON "public"."org_investigations" USING "btree" ("status");



CREATE INDEX "idx_legal_holds_org" ON "public"."legal_holds" USING "btree" ("org_id");



CREATE INDEX "idx_lhd_hold" ON "public"."legal_hold_documents" USING "btree" ("legal_hold_id");



CREATE INDEX "idx_med_admin_time" ON "public"."org_medication_administrations" USING "btree" ("medication_id", "administered_at");



CREATE INDEX "idx_medications_participant" ON "public"."org_medications" USING "btree" ("participant_id", "status");



CREATE INDEX "idx_memberships_org_id" ON "public"."memberships" USING "btree" ("org_id");



CREATE INDEX "idx_memberships_organization_id" ON "public"."memberships" USING "btree" ("organization_id");



CREATE INDEX "idx_ndis_line_items_org" ON "public"."org_ndis_line_items" USING "btree" ("org_id", "status");



CREATE INDEX "idx_ndis_line_items_participant" ON "public"."org_ndis_line_items" USING "btree" ("participant_id");



CREATE INDEX "idx_ocm_org" ON "public"."org_control_mappings" USING "btree" ("organization_id");



CREATE INDEX "idx_ocm_org_control" ON "public"."org_control_mappings" USING "btree" ("organization_id", "control_id");



CREATE INDEX "idx_org_assets_organization_id_created_at" ON "public"."org_assets" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_audit_events_action_type" ON "public"."org_audit_events" USING "btree" ("organization_id", "action_type", "created_at" DESC);



CREATE INDEX "idx_org_audit_events_actor" ON "public"."org_audit_events" USING "btree" ("organization_id", "actor_user_id", "created_at" DESC);



CREATE INDEX "idx_org_audit_events_org_created" ON "public"."org_audit_events" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_audit_logs_action" ON "public"."org_audit_logs" USING "btree" ("organization_id", "action", "created_at" DESC);



CREATE INDEX "idx_org_audit_logs_entity_lookup" ON "public"."org_audit_logs" USING "btree" ("organization_id", "entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "idx_org_audit_logs_org_created" ON "public"."org_audit_logs" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_care_plan_versions_org" ON "public"."org_care_plan_versions" USING "btree" ("organization_id", "changed_at" DESC);



CREATE INDEX "idx_org_care_plan_versions_plan" ON "public"."org_care_plan_versions" USING "btree" ("care_plan_id", "version_number" DESC);



CREATE INDEX "idx_org_control_eval_framework" ON "public"."org_control_evaluations" USING "btree" ("organization_id", "control_type") WHERE ("control_type" ~~ 'framework_%'::"text");



CREATE INDEX "idx_org_control_eval_status" ON "public"."org_control_evaluations" USING "btree" ("organization_id", "status", "last_evaluated_at" DESC);



CREATE INDEX "idx_org_evidence_capa_entity" ON "public"."org_evidence" USING "btree" ("organization_id", "entity_id") WHERE ("entity_type" = 'capa'::"text");



CREATE INDEX "idx_org_evidence_entity" ON "public"."org_evidence" USING "btree" ("organization_id", "entity_id", "created_at" DESC) WHERE ("entity_id" IS NOT NULL);



CREATE INDEX "idx_org_evidence_file_hash" ON "public"."org_evidence" USING "btree" ("file_hash") WHERE ("file_hash" IS NOT NULL);



CREATE INDEX "idx_org_evidence_org_created" ON "public"."org_evidence" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_evidence_organization_id_created_at" ON "public"."org_evidence" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_evidence_patient" ON "public"."org_evidence" USING "btree" ("organization_id", "patient_id", "created_at" DESC) WHERE ("patient_id" IS NOT NULL);



CREATE INDEX "idx_org_evidence_task_org" ON "public"."org_evidence" USING "btree" ("organization_id", "task_id") WHERE ("task_id" IS NOT NULL);



CREATE INDEX "idx_org_files_org_id" ON "public"."org_files" USING "btree" ("org_id");



CREATE INDEX "idx_org_form_submissions_data" ON "public"."org_form_submissions" USING "gin" ("data");



CREATE INDEX "idx_org_form_submissions_form" ON "public"."org_form_submissions" USING "btree" ("form_id", "created_at" DESC);



CREATE INDEX "idx_org_form_submissions_org" ON "public"."org_form_submissions" USING "btree" ("org_id");



CREATE INDEX "idx_org_form_submissions_status" ON "public"."org_form_submissions" USING "btree" ("form_id", "status");



CREATE INDEX "idx_org_form_submissions_submitted_by" ON "public"."org_form_submissions" USING "btree" ("submitted_by");



CREATE INDEX "idx_org_form_templates_category" ON "public"."org_form_templates" USING "btree" ("category");



CREATE INDEX "idx_org_form_templates_industry" ON "public"."org_form_templates" USING "btree" ("industry");



CREATE INDEX "idx_org_forms_created" ON "public"."org_forms" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_org_forms_org_id" ON "public"."org_forms" USING "btree" ("org_id");



CREATE INDEX "idx_org_forms_slug" ON "public"."org_forms" USING "btree" ("org_id", "slug");



CREATE INDEX "idx_org_forms_status" ON "public"."org_forms" USING "btree" ("org_id", "status");



CREATE INDEX "idx_org_frameworks_organization_id" ON "public"."org_frameworks" USING "btree" ("organization_id");



CREATE INDEX "idx_org_group_members_group" ON "public"."org_group_members" USING "btree" ("group_id");



CREATE INDEX "idx_org_groups_parent" ON "public"."org_groups" USING "btree" ("parent_org_id");



CREATE INDEX "idx_org_incidents_open" ON "public"."org_incidents" USING "btree" ("organization_id", "status", "occurred_at" DESC) WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_org_incidents_patient" ON "public"."org_incidents" USING "btree" ("organization_id", "patient_id", "occurred_at" DESC);



CREATE INDEX "idx_org_incidents_severity" ON "public"."org_incidents" USING "btree" ("organization_id", "severity", "status", "occurred_at" DESC);



CREATE INDEX "idx_org_industries_org_id" ON "public"."org_industries" USING "btree" ("org_id");



CREATE INDEX "idx_org_integrations_org" ON "public"."org_integrations" USING "btree" ("org_id");



CREATE INDEX "idx_org_members_employee_onboarded_at" ON "public"."org_members" USING "btree" ("user_id", "employee_onboarded_at") WHERE ("employee_onboarded_at" IS NOT NULL);



CREATE INDEX "idx_org_module_entitlements_org_id" ON "public"."org_module_entitlements" USING "btree" ("org_id");



CREATE INDEX "idx_org_notifications_org" ON "public"."org_notifications" USING "btree" ("org_id");



CREATE INDEX "idx_org_notifications_user_created" ON "public"."org_notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_org_patient_assignments_org_status" ON "public"."org_patient_assignments" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_org_patient_assignments_patient" ON "public"."org_patient_assignments" USING "btree" ("patient_id");



CREATE INDEX "idx_org_patient_assignments_user" ON "public"."org_patient_assignments" USING "btree" ("organization_id", "user_id", "status");



CREATE INDEX "idx_org_patients_care_status" ON "public"."org_patients" USING "btree" ("organization_id", "care_status");



CREATE INDEX "idx_org_patients_emergency" ON "public"."org_patients" USING "btree" ("organization_id", "emergency_flag") WHERE ("emergency_flag" = true);



CREATE INDEX "idx_org_patients_external_id" ON "public"."org_patients" USING "btree" ("organization_id", "external_id") WHERE ("external_id" IS NOT NULL);



CREATE INDEX "idx_org_patients_risk" ON "public"."org_patients" USING "btree" ("organization_id", "risk_level") WHERE ("risk_level" = ANY (ARRAY['high'::"text", 'critical'::"text"]));



CREATE INDEX "idx_org_policies_organization_id_created_at" ON "public"."org_policies" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_progress_notes_patient" ON "public"."org_progress_notes" USING "btree" ("organization_id", "patient_id", "created_at" DESC);



CREATE INDEX "idx_org_progress_notes_staff" ON "public"."org_progress_notes" USING "btree" ("organization_id", "staff_user_id", "created_at" DESC);



CREATE INDEX "idx_org_progress_notes_status" ON "public"."org_progress_notes" USING "btree" ("organization_id", "status_tag", "created_at" DESC) WHERE ("status_tag" = ANY (ARRAY['incident'::"text", 'risk'::"text"]));



CREATE INDEX "idx_org_risks_organization_id_created_at" ON "public"."org_risks" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_settings_org_key" ON "public"."org_settings" USING "btree" ("organization_id", "key");



CREATE INDEX "idx_org_subscriptions_active" ON "public"."org_subscriptions" USING "btree" ("status", "current_period_end") WHERE ("status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"]));



CREATE INDEX "idx_org_subscriptions_price_id" ON "public"."org_subscriptions" USING "btree" ("price_id") WHERE ("price_id" IS NOT NULL);



CREATE INDEX "idx_org_subscriptions_stripe_customer" ON "public"."org_subscriptions" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_org_subscriptions_trial_expires" ON "public"."org_subscriptions" USING "btree" ("trial_expires_at") WHERE ("status" = 'trialing'::"public"."subscription_status");



CREATE INDEX "idx_org_tasks_assigned" ON "public"."org_tasks" USING "btree" ("organization_id", "assigned_to", "status") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "idx_org_tasks_org_created" ON "public"."org_tasks" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_tasks_organization_id_created_at" ON "public"."org_tasks" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_org_tasks_patient" ON "public"."org_tasks" USING "btree" ("organization_id", "patient_id", "created_at" DESC) WHERE ("patient_id" IS NOT NULL);



CREATE INDEX "idx_org_tasks_status_due" ON "public"."org_tasks" USING "btree" ("organization_id", "status", "due_date") WHERE ("status" <> 'completed'::"text");



CREATE INDEX "idx_org_workflow_exec_failed" ON "public"."org_workflow_executions" USING "btree" ("organization_id", "status", "executed_at" DESC) WHERE ("status" = 'failed'::"text");



CREATE INDEX "idx_org_workflow_exec_time" ON "public"."org_workflow_executions" USING "btree" ("organization_id", "executed_at" DESC);



CREATE INDEX "idx_org_workflow_exec_workflow" ON "public"."org_workflow_executions" USING "btree" ("workflow_id", "executed_at" DESC);



CREATE INDEX "idx_org_workflows_enabled" ON "public"."org_workflows" USING "btree" ("organization_id", "enabled");



CREATE INDEX "idx_org_workflows_trigger" ON "public"."org_workflows" USING "btree" ("organization_id", "trigger") WHERE ("enabled" = true);



CREATE INDEX "idx_organizations_retire_purge_at" ON "public"."organizations" USING "btree" ("retire_purge_at") WHERE ("retire_purge_at" IS NOT NULL);



CREATE INDEX "idx_policy_acks_policy" ON "public"."policy_acknowledgments" USING "btree" ("policy_id");



CREATE INDEX "idx_policy_approvals_version" ON "public"."policy_approvals" USING "btree" ("policy_version_id");



CREATE INDEX "idx_policy_review_org" ON "public"."policy_review_schedules" USING "btree" ("org_id");



CREATE INDEX "idx_policy_versions_org" ON "public"."policy_versions" USING "btree" ("org_id");



CREATE INDEX "idx_policy_versions_policy" ON "public"."policy_versions" USING "btree" ("policy_id");



CREATE INDEX "idx_policy_versions_policy_version" ON "public"."policy_versions" USING "btree" ("policy_id", "version_number" DESC);



CREATE INDEX "idx_purged_subject_redactions_email_lower" ON "public"."purged_subject_redactions" USING "btree" ("lower"("email")) WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_purged_subject_redactions_purged_at" ON "public"."purged_subject_redactions" USING "btree" ("purged_at" DESC);



CREATE INDEX "idx_push_tokens_user" ON "public"."push_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_recent_items_user" ON "public"."recent_items" USING "btree" ("org_id", "user_id", "accessed_at" DESC);



CREATE INDEX "idx_reg_notifications_incident" ON "public"."org_regulatory_notifications" USING "btree" ("incident_id");



CREATE INDEX "idx_reg_notifications_org" ON "public"."org_regulatory_notifications" USING "btree" ("organization_id");



CREATE INDEX "idx_reg_notifications_status" ON "public"."org_regulatory_notifications" USING "btree" ("status");



CREATE INDEX "idx_report_generations_org" ON "public"."org_report_generations" USING "btree" ("org_id", "generated_at");



CREATE INDEX "idx_report_generations_template" ON "public"."report_generations" USING "btree" ("template_id");



CREATE INDEX "idx_report_templates_org" ON "public"."report_templates" USING "btree" ("organization_id");



CREATE INDEX "idx_reports_created" ON "public"."reports" USING "btree" ("created_at");



CREATE INDEX "idx_reports_org" ON "public"."reports" USING "btree" ("organization_id");



CREATE INDEX "idx_reports_user" ON "public"."reports" USING "btree" ("user_id");



CREATE INDEX "idx_retention_policies_org" ON "public"."retention_policies" USING "btree" ("org_id");



CREATE INDEX "idx_risk_analyses_created" ON "public"."risk_analyses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_risk_analyses_level" ON "public"."risk_analyses" USING "btree" ("risk_level");



CREATE INDEX "idx_risk_analyses_org" ON "public"."risk_analyses" USING "btree" ("organization_id");



CREATE INDEX "idx_risk_analyses_org_created" ON "public"."risk_analyses" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_risk_analyses_risks_by_severity" ON "public"."risk_analyses" USING "gin" ("risks_by_severity");



CREATE INDEX "idx_saved_reports_org" ON "public"."org_saved_reports" USING "btree" ("org_id", "type");



CREATE INDEX "idx_saved_searches_user" ON "public"."saved_searches" USING "btree" ("org_id", "user_id");



CREATE INDEX "idx_scan_findings_org" ON "public"."scan_findings" USING "btree" ("organization_id");



CREATE INDEX "idx_scan_findings_scan" ON "public"."scan_findings" USING "btree" ("scan_id");



CREATE INDEX "idx_scan_findings_severity" ON "public"."scan_findings" USING "btree" ("severity");



CREATE INDEX "idx_scan_findings_status" ON "public"."scan_findings" USING "btree" ("status");



CREATE INDEX "idx_scheduled_tasks_enabled" ON "public"."scheduled_tasks" USING "btree" ("enabled");



CREATE INDEX "idx_scheduled_tasks_next_run" ON "public"."scheduled_tasks" USING "btree" ("next_run");



CREATE INDEX "idx_scheduled_tasks_org" ON "public"."scheduled_tasks" USING "btree" ("organization_id");



CREATE INDEX "idx_scheduled_tasks_type" ON "public"."scheduled_tasks" USING "btree" ("task_type");



CREATE INDEX "idx_search_history_user" ON "public"."search_history" USING "btree" ("org_id", "user_id", "searched_at" DESC);



CREATE INDEX "idx_search_index_org" ON "public"."search_index" USING "btree" ("org_id");



CREATE INDEX "idx_search_index_trigram" ON "public"."search_index" USING "gin" ("title" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_search_index_type" ON "public"."search_index" USING "btree" ("org_id", "entity_type");



CREATE INDEX "idx_search_index_vector" ON "public"."search_index" USING "gin" ("search_vector");



CREATE INDEX "idx_security_alerts_event_id" ON "public"."security_alerts" USING "btree" ("event_id");



CREATE INDEX "idx_security_alerts_status" ON "public"."security_alerts" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_security_events_created_at" ON "public"."security_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_events_high_severity" ON "public"."security_events" USING "btree" ("severity", "created_at" DESC) WHERE ("severity" = ANY (ARRAY['high'::"text", 'critical'::"text"]));



CREATE INDEX "idx_security_events_ip" ON "public"."security_events" USING "btree" ("ip_address") WHERE ("ip_address" IS NOT NULL);



CREATE INDEX "idx_security_events_org_id" ON "public"."security_events" USING "btree" ("org_id") WHERE ("org_id" IS NOT NULL);



CREATE INDEX "idx_security_events_severity" ON "public"."security_events" USING "btree" ("severity");



CREATE INDEX "idx_security_events_type" ON "public"."security_events" USING "btree" ("type");



CREATE INDEX "idx_security_events_user_id" ON "public"."security_events" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_snapshots_org_date" ON "public"."org_analytics_snapshots" USING "btree" ("org_id", "snapshot_date");



CREATE INDEX "idx_staff_credentials_expiry" ON "public"."org_staff_credentials" USING "btree" ("expiry_date");



CREATE INDEX "idx_staff_credentials_org" ON "public"."org_staff_credentials" USING "btree" ("organization_id");



CREATE INDEX "idx_staff_credentials_status" ON "public"."org_staff_credentials" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_staff_credentials_user" ON "public"."org_staff_credentials" USING "btree" ("user_id");



CREATE INDEX "idx_sync_log_created" ON "public"."integration_sync_log" USING "btree" ("created_at");



CREATE INDEX "idx_sync_log_integration" ON "public"."integration_sync_log" USING "btree" ("integration_id");



CREATE INDEX "idx_task_comments_task" ON "public"."task_comments" USING "btree" ("task_id", "created_at");



CREATE INDEX "idx_task_deps_depends" ON "public"."task_dependencies" USING "btree" ("depends_on_task_id");



CREATE INDEX "idx_task_deps_task" ON "public"."task_dependencies" USING "btree" ("task_id");



CREATE INDEX "idx_task_recurrence_org" ON "public"."task_recurrence" USING "btree" ("org_id", "active");



CREATE INDEX "idx_task_time_task" ON "public"."task_time_entries" USING "btree" ("task_id");



CREATE INDEX "idx_tasks_organization_id" ON "public"."tasks" USING "btree" ("organization_id");



CREATE INDEX "idx_team_groups_org" ON "public"."team_groups" USING "btree" ("org_id");



CREATE INDEX "idx_team_invitations_email" ON "public"."team_invitations" USING "btree" ("email");



CREATE INDEX "idx_team_invitations_expires_at" ON "public"."team_invitations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_team_invitations_org" ON "public"."team_invitations" USING "btree" ("organization_id");



CREATE INDEX "idx_team_invitations_org_email_status" ON "public"."team_invitations" USING "btree" ("organization_id", "email", "status");



CREATE INDEX "idx_team_invitations_token" ON "public"."team_invitations" USING "btree" ("token");



CREATE INDEX "idx_team_members_team" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "idx_team_members_user" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "idx_trust_packets_expires_at" ON "public"."trust_packets" USING "btree" ("expires_at");



CREATE INDEX "idx_trust_packets_org_id" ON "public"."trust_packets" USING "btree" ("org_id");



CREATE INDEX "idx_trust_packets_token" ON "public"."trust_packets" USING "btree" ("token");



CREATE INDEX "idx_usage_event" ON "public"."org_usage_events" USING "btree" ("event_type", "event_name");



CREATE INDEX "idx_usage_org_time" ON "public"."org_usage_events" USING "btree" ("org_id", "created_at" DESC);



CREATE INDEX "idx_usage_summaries_org" ON "public"."org_usage_summaries" USING "btree" ("org_id", "period_type", "period_start" DESC);



CREATE INDEX "idx_user_activity_action" ON "public"."user_activity" USING "btree" ("action");



CREATE INDEX "idx_user_activity_created_at" ON "public"."user_activity" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_activity_org_id" ON "public"."user_activity" USING "btree" ("org_id") WHERE ("org_id" IS NOT NULL);



CREATE INDEX "idx_user_activity_user_id" ON "public"."user_activity" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_purge_jobs_status" ON "public"."user_purge_jobs" USING "btree" ("status", "requested_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'running'::"text"]));



CREATE INDEX "idx_user_purge_jobs_user_id" ON "public"."user_purge_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_user_session_revocations_revoked_at" ON "public"."user_session_revocations" USING "btree" ("revoked_at" DESC);



CREATE INDEX "idx_visits_client" ON "public"."org_visits" USING "btree" ("client_id");



CREATE INDEX "idx_visits_org" ON "public"."org_visits" USING "btree" ("organization_id");



CREATE INDEX "idx_visits_scheduled" ON "public"."org_visits" USING "btree" ("scheduled_start");



CREATE INDEX "idx_visits_staff" ON "public"."org_visits" USING "btree" ("staff_id");



CREATE INDEX "idx_visits_status" ON "public"."org_visits" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_visits_worker_date" ON "public"."org_visits" USING "btree" ("staff_id", "scheduled_start");



CREATE INDEX "idx_webhook_configs_org" ON "public"."webhook_configs" USING "btree" ("organization_id");



CREATE INDEX "idx_webhook_deliveries_created" ON "public"."webhook_deliveries" USING "btree" ("created_at");



CREATE INDEX "idx_webhook_deliveries_status" ON "public"."webhook_deliveries" USING "btree" ("status");



CREATE INDEX "idx_webhook_deliveries_webhook" ON "public"."webhook_deliveries" USING "btree" ("webhook_id");



CREATE INDEX "idx_webhook_deliveries_webhook_status" ON "public"."webhook_deliveries" USING "btree" ("webhook_id", "status");



CREATE INDEX "idx_workflow_executions_executed_at" ON "public"."org_workflow_executions" USING "btree" ("executed_at");



CREATE INDEX "idx_workflow_executions_workflow_id" ON "public"."org_workflow_executions" USING "btree" ("workflow_id");



CREATE INDEX "idx_workflows_enabled" ON "public"."org_workflows" USING "btree" ("enabled");



CREATE INDEX "idx_workflows_org_id" ON "public"."org_workflows" USING "btree" ("organization_id");



CREATE INDEX "idx_workflows_trigger" ON "public"."org_workflows" USING "btree" ("trigger");



CREATE INDEX "marketing_config_section_idx" ON "public"."marketing_config" USING "btree" ("environment", "section");



CREATE UNIQUE INDEX "marketing_config_unique_key_idx" ON "public"."marketing_config" USING "btree" ("environment", "section", "config_key");



CREATE INDEX "marketing_config_updated_idx" ON "public"."marketing_config" USING "btree" ("updated_at" DESC);



CREATE INDEX "master_controls_code_idx" ON "public"."master_controls" USING "btree" ("control_code");



CREATE INDEX "memberships_org_id_idx" ON "public"."memberships" USING "btree" ("org_id");



CREATE INDEX "org_audit_events_org_created_idx" ON "public"."org_audit_events" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_audit_events_org_idx" ON "public"."org_audit_events" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_audit_logs_org_created_idx" ON "public"."org_audit_logs" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_behaviour_support_plans_expires_at_idx" ON "public"."org_behaviour_support_plans" USING "btree" ("organization_id", "expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "org_behaviour_support_plans_org_status_idx" ON "public"."org_behaviour_support_plans" USING "btree" ("organization_id", "status");



CREATE INDEX "org_behaviour_support_plans_participant_idx" ON "public"."org_behaviour_support_plans" USING "btree" ("organization_id", "participant_id");



CREATE INDEX "org_certifications_org_created_idx" ON "public"."org_certifications" USING "btree" ("organization_id", "created_at");



CREATE UNIQUE INDEX "org_compliance_blocks_active_unique" ON "public"."org_compliance_blocks" USING "btree" ("organization_id", "gate_key") WHERE ("resolved_at" IS NULL);



CREATE INDEX "org_compliance_blocks_org_gate_idx" ON "public"."org_compliance_blocks" USING "btree" ("organization_id", "gate_key") WHERE ("resolved_at" IS NULL);



CREATE INDEX "org_compliance_health_snapshots_org_at_idx" ON "public"."org_compliance_health_snapshots" USING "btree" ("organization_id", "snapshot_at" DESC);



CREATE INDEX "org_control_evaluations_eval_idx" ON "public"."org_control_evaluations" USING "btree" ("organization_id", "last_evaluated_at");



CREATE UNIQUE INDEX "org_control_evaluations_org_control_key" ON "public"."org_control_evaluations" USING "btree" ("organization_id", "control_type", "control_key");



CREATE INDEX "org_control_evaluations_org_id_idx" ON "public"."org_control_evaluations" USING "btree" ("organization_id");



CREATE INDEX "org_entities_org_idx" ON "public"."org_entities" USING "btree" ("organization_id", "entity_type");



CREATE INDEX "org_entity_members_entity_idx" ON "public"."org_entity_members" USING "btree" ("entity_id");



CREATE INDEX "org_evidence_created_at_idx" ON "public"."org_evidence" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_evidence_org_id_idx" ON "public"."org_evidence" USING "btree" ("organization_id");



CREATE INDEX "org_evidence_patient_idx" ON "public"."org_evidence" USING "btree" ("organization_id", "patient_id");



CREATE INDEX "org_exports_org_created_idx" ON "public"."org_exports" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_incidents_org_patient_idx" ON "public"."org_incidents" USING "btree" ("organization_id", "patient_id", "occurred_at");



CREATE INDEX "org_members_org_user_idx" ON "public"."org_members" USING "btree" ("organization_id", "user_id");



CREATE INDEX "org_notifications_user_unread_idx" ON "public"."org_notifications" USING "btree" ("user_id", "read_at");



CREATE INDEX "org_patients_org_idx" ON "public"."org_patients" USING "btree" ("organization_id", "full_name");



CREATE INDEX "org_policies_ndis_category_idx" ON "public"."org_policies" USING "btree" ("organization_id", "ndis_category") WHERE ("ndis_category" IS NOT NULL);



CREATE INDEX "org_progress_notes_org_patient_idx" ON "public"."org_progress_notes" USING "btree" ("organization_id", "patient_id", "created_at");



CREATE INDEX "org_shifts_org_patient_idx" ON "public"."org_shifts" USING "btree" ("organization_id", "patient_id", "started_at");



CREATE UNIQUE INDEX "org_subscriptions_org_id_key" ON "public"."org_subscriptions" USING "btree" ("organization_id");



CREATE INDEX "org_tasks_created_at_idx" ON "public"."org_tasks" USING "btree" ("organization_id", "created_at");



CREATE INDEX "org_tasks_org_id_idx" ON "public"."org_tasks" USING "btree" ("organization_id");



CREATE INDEX "org_tasks_patient_idx" ON "public"."org_tasks" USING "btree" ("organization_id", "patient_id");



CREATE INDEX "organizations_last_retention_at_idx" ON "public"."organizations" USING "btree" ("last_retention_at" NULLS FIRST, "id") WHERE ("is_active" = true);



CREATE INDEX "password_history_user_idx" ON "public"."password_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "platform_security_audit_log_created_idx" ON "public"."platform_security_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "platform_security_audit_log_email_idx" ON "public"."platform_security_audit_log" USING "btree" ("email", "created_at" DESC) WHERE ("email" IS NOT NULL);



CREATE INDEX "platform_security_audit_log_event_type_idx" ON "public"."platform_security_audit_log" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "product_releases_status_idx" ON "public"."product_releases" USING "btree" ("release_status");



CREATE INDEX "product_releases_version_idx" ON "public"."product_releases" USING "btree" ("version_code");



CREATE INDEX "rate_limit_log_created_idx" ON "public"."rate_limit_log" USING "btree" ("created_at");



CREATE INDEX "rate_limit_log_identifier_idx" ON "public"."rate_limit_log" USING "btree" ("identifier", "endpoint", "window_start");



CREATE INDEX "report_export_jobs_org_idx" ON "public"."report_export_jobs" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "report_export_jobs_queue_idx" ON "public"."report_export_jobs" USING "btree" ("status", "next_run_at", "created_at");



CREATE INDEX "restore_test_runs_performed_at_idx" ON "public"."restore_test_runs" USING "btree" ("performed_at" DESC);



CREATE INDEX "secret_rotations_secret_name_rotated_at_idx" ON "public"."secret_rotations" USING "btree" ("secret_name", "rotated_at" DESC);



CREATE INDEX "security_audit_log_org_idx" ON "public"."security_audit_log" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "security_audit_log_type_idx" ON "public"."security_audit_log" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "security_audit_log_user_idx" ON "public"."security_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "snapshots_date_idx" ON "public"."compliance_score_snapshots" USING "btree" ("snapshot_date" DESC);



CREATE INDEX "snapshots_org_framework_date_idx" ON "public"."compliance_score_snapshots" USING "btree" ("organization_id", "framework_slug", "snapshot_date" DESC);



CREATE INDEX "support_requests_status_idx" ON "public"."support_requests" USING "btree" ("status");



CREATE INDEX "system_settings_category_idx" ON "public"."system_settings" USING "btree" ("environment", "category");



CREATE UNIQUE INDEX "system_settings_unique_key_idx" ON "public"."system_settings" USING "btree" ("environment", "category", "setting_key");



CREATE INDEX "system_settings_updated_idx" ON "public"."system_settings" USING "btree" ("updated_at" DESC);



CREATE INDEX "team_invitations_org_status_idx" ON "public"."team_invitations" USING "btree" ("organization_id", "status");



CREATE INDEX "user_preferences_current_org_idx" ON "public"."user_preferences" USING "btree" ("current_organization_id") WHERE ("current_organization_id" IS NOT NULL);



CREATE INDEX "user_profiles_org_user_idx" ON "public"."user_profiles" USING "btree" ("organization_id", "user_id");



CREATE INDEX "user_security_mfa_passed_session_idx" ON "public"."user_security" USING "btree" ("user_id", "mfa_passed_session_id");



CREATE INDEX "user_sessions_token_hash_idx" ON "public"."user_sessions" USING "btree" ("session_token_hash");



CREATE INDEX "user_sessions_user_idx" ON "public"."user_sessions" USING "btree" ("user_id", "expires_at");



CREATE OR REPLACE TRIGGER "admin_jobs_touch_updated_at" BEFORE UPDATE ON "public"."admin_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."control_plane_touch_updated_at"();



CREATE OR REPLACE TRIGGER "audit_log_immutable" BEFORE DELETE OR UPDATE ON "public"."audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."control_plane_prevent_audit_mutation"();



CREATE OR REPLACE TRIGGER "audit_org_control_evaluation_change" AFTER DELETE OR UPDATE ON "public"."org_control_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."_audit_org_control_evaluation_change"();



COMMENT ON TRIGGER "audit_org_control_evaluation_change" ON "public"."org_control_evaluations" IS 'R5 (2026-05-27): logs every UPDATE/DELETE to audit_log via the hash-chained audit_log_append RPC.';



CREATE OR REPLACE TRIGGER "care_goals_updated_at" BEFORE UPDATE ON "public"."org_care_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "care_industries_set_updated_at" BEFORE UPDATE ON "public"."care_industries" FOR EACH ROW EXECUTE FUNCTION "public"."care_set_updated_at"();



CREATE OR REPLACE TRIGGER "care_policy_templates_set_updated_at" BEFORE UPDATE ON "public"."care_policy_templates" FOR EACH ROW EXECUTE FUNCTION "public"."care_set_updated_at"();



CREATE OR REPLACE TRIGGER "care_register_templates_set_updated_at" BEFORE UPDATE ON "public"."care_register_templates" FOR EACH ROW EXECUTE FUNCTION "public"."care_set_updated_at"();



CREATE OR REPLACE TRIGGER "care_service_types_set_updated_at" BEFORE UPDATE ON "public"."care_service_types" FOR EACH ROW EXECUTE FUNCTION "public"."care_set_updated_at"();



CREATE OR REPLACE TRIGGER "care_task_templates_set_updated_at" BEFORE UPDATE ON "public"."care_task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."care_set_updated_at"();



CREATE OR REPLACE TRIGGER "ensure_user_profile_from_org_member" AFTER INSERT ON "public"."org_members" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_user_profile_from_org_member"();



CREATE OR REPLACE TRIGGER "feature_flags_touch_updated_at" BEFORE UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."control_plane_touch_updated_at"();



CREATE OR REPLACE TRIGGER "forms_updated_at" BEFORE UPDATE ON "public"."forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "fos_demote_revokes_api_keys" AFTER UPDATE ON "public"."org_members" FOR EACH ROW EXECUTE FUNCTION "public"."_fos_revoke_api_keys_for_demoted_admin"();



CREATE OR REPLACE TRIGGER "fos_remove_revokes_api_keys" AFTER DELETE ON "public"."org_members" FOR EACH ROW EXECUTE FUNCTION "public"."_fos_revoke_api_keys_for_removed_member"();



CREATE OR REPLACE TRIGGER "marketing_config_touch_updated_at" BEFORE UPDATE ON "public"."marketing_config" FOR EACH ROW EXECUTE FUNCTION "public"."control_plane_touch_updated_at"();



CREATE OR REPLACE TRIGGER "medications_updated_at" BEFORE UPDATE ON "public"."org_medications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "org_audit_events_immutable" BEFORE DELETE OR UPDATE ON "public"."org_audit_events" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_mutation"();



CREATE OR REPLACE TRIGGER "org_audit_logs_immutable" BEFORE DELETE OR UPDATE ON "public"."org_audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_audit_mutation"();



CREATE OR REPLACE TRIGGER "org_care_plans_version_on_update" AFTER UPDATE ON "public"."org_care_plans" FOR EACH ROW EXECUTE FUNCTION "public"."org_care_plans_snapshot_version"();



CREATE OR REPLACE TRIGGER "org_memberships_set_updated_at" BEFORE UPDATE ON "public"."org_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "org_module_entitlements_set_updated_at" BEFORE UPDATE ON "public"."org_module_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "org_progress_notes_lock_signed" BEFORE UPDATE ON "public"."org_progress_notes" FOR EACH ROW EXECUTE FUNCTION "public"."org_progress_notes_block_signed_updates"();



CREATE OR REPLACE TRIGGER "org_subscriptions_set_updated_at" BEFORE UPDATE ON "public"."org_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "saved_reports_updated_at" BEFORE UPDATE ON "public"."org_saved_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "security_alerts_updated_at" BEFORE UPDATE ON "public"."security_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_security_alerts_updated_at"();



CREATE OR REPLACE TRIGGER "system_settings_touch_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."control_plane_touch_updated_at"();



CREATE OR REPLACE TRIGGER "tr_audit_registers" AFTER INSERT OR UPDATE ON "public"."org_registers" FOR EACH ROW EXECUTE FUNCTION "public"."log_generic_activity"();



CREATE OR REPLACE TRIGGER "trg_org_forms_updated_at" BEFORE UPDATE ON "public"."org_forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_org_forms_updated_at"();



CREATE OR REPLACE TRIGGER "trg_prevent_org_control_evaluations_update" BEFORE UPDATE ON "public"."org_control_evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_org_control_evaluations_update"();



CREATE OR REPLACE TRIGGER "trigger_set_mfa_required" BEFORE INSERT OR UPDATE OF "role" ON "public"."org_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_mfa_required_on_role"();



CREATE OR REPLACE TRIGGER "trigger_workflow_updated_at" BEFORE UPDATE ON "public"."org_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_workflow_updated_at"();



CREATE OR REPLACE TRIGGER "trust_packets_updated_at" BEFORE UPDATE ON "public"."trust_packets" FOR EACH ROW EXECUTE FUNCTION "public"."update_trust_packets_updated_at"();



CREATE OR REPLACE TRIGGER "update_api_alert_config_updated_at" BEFORE UPDATE ON "public"."api_alert_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_care_plans_updated_at" BEFORE UPDATE ON "public"."org_care_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dashboard_layouts_updated_at" BEFORE UPDATE ON "public"."dashboard_layouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_email_preferences_updated_at" BEFORE UPDATE ON "public"."email_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_file_metadata_updated_at" BEFORE UPDATE ON "public"."file_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_incidents_updated_at" BEFORE UPDATE ON "public"."org_incidents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_integration_configs_updated_at" BEFORE UPDATE ON "public"."integration_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_report_templates_updated_at" BEFORE UPDATE ON "public"."report_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scheduled_tasks_updated_at" BEFORE UPDATE ON "public"."scheduled_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_credentials_updated_at" BEFORE UPDATE ON "public"."org_staff_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_visits_updated_at" BEFORE UPDATE ON "public"."org_visits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_webhook_configs_updated_at" BEFORE UPDATE ON "public"."webhook_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_preferences_set_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_user_preferences_updated_at"();



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_notes"
    ADD CONSTRAINT "admin_notes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_document_embeddings"
    ADD CONSTRAINT "ai_document_embeddings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_index_status"
    ADD CONSTRAINT "ai_index_status_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_risk_analysis_id_fkey" FOREIGN KEY ("risk_analysis_id") REFERENCES "public"."risk_analyses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_log"
    ADD CONSTRAINT "ai_usage_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_alert_config"
    ADD CONSTRAINT "api_alert_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_key_usage_log"
    ADD CONSTRAINT "api_key_usage_log_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_key_usage_log"
    ADD CONSTRAINT "api_key_usage_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_chain_anchors"
    ADD CONSTRAINT "audit_chain_anchors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_chain_secrets"
    ADD CONSTRAINT "audit_chain_secrets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_export_jobs"
    ADD CONSTRAINT "audit_export_jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_retention_config"
    ADD CONSTRAINT "audit_retention_config_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auditor_access_tokens"
    ADD CONSTRAINT "auditor_access_tokens_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auditor_activity_log"
    ADD CONSTRAINT "auditor_activity_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auditor_activity_log"
    ADD CONSTRAINT "auditor_activity_log_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "public"."auditor_access_tokens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_events_audit"
    ADD CONSTRAINT "billing_events_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_reconciliation_log"
    ADD CONSTRAINT "billing_reconciliation_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."care_policy_templates"
    ADD CONSTRAINT "care_policy_templates_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."care_industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."care_policy_templates"
    ADD CONSTRAINT "care_policy_templates_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "public"."care_service_types"("id");



ALTER TABLE ONLY "public"."care_register_templates"
    ADD CONSTRAINT "care_register_templates_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."care_industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."care_service_types"
    ADD CONSTRAINT "care_service_types_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."care_industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."care_task_templates"
    ADD CONSTRAINT "care_task_templates_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."care_industries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."care_task_templates"
    ADD CONSTRAINT "care_task_templates_register_template_id_fkey" FOREIGN KEY ("register_template_id") REFERENCES "public"."care_register_templates"("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_controls"
    ADD CONSTRAINT "compliance_controls_framework_control_id_fkey" FOREIGN KEY ("framework_control_id") REFERENCES "public"."framework_controls"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_controls"
    ADD CONSTRAINT "compliance_controls_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_frameworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_export_jobs"
    ADD CONSTRAINT "compliance_export_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_export_jobs"
    ADD CONSTRAINT "compliance_export_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_playbook_controls"
    ADD CONSTRAINT "compliance_playbook_controls_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_playbook_controls"
    ADD CONSTRAINT "compliance_playbook_controls_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "public"."compliance_playbooks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_playbooks"
    ADD CONSTRAINT "compliance_playbooks_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_frameworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_scans"
    ADD CONSTRAINT "compliance_scans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_score_snapshots"
    ADD CONSTRAINT "compliance_score_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_evidence"
    ADD CONSTRAINT "control_evidence_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_evidence"
    ADD CONSTRAINT "control_evidence_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_group_members"
    ADD CONSTRAINT "control_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."control_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_mappings"
    ADD CONSTRAINT "control_mappings_internal_control_id_fkey" FOREIGN KEY ("internal_control_id") REFERENCES "public"."framework_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_tasks"
    ADD CONSTRAINT "control_tasks_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."control_tasks"
    ADD CONSTRAINT "control_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dashboard_layouts"
    ADD CONSTRAINT "dashboard_layouts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_lifecycle_log"
    ADD CONSTRAINT "document_lifecycle_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enterprise_export_jobs"
    ADD CONSTRAINT "enterprise_export_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_metadata"
    ADD CONSTRAINT "file_metadata_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_versions"
    ADD CONSTRAINT "file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."file_metadata"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_versions"
    ADD CONSTRAINT "file_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_responses"
    ADD CONSTRAINT "form_responses_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forms"
    ADD CONSTRAINT "forms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."framework_control_mappings"
    ADD CONSTRAINT "framework_control_mappings_framework_control_id_fkey" FOREIGN KEY ("framework_control_id") REFERENCES "public"."framework_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."framework_control_mappings"
    ADD CONSTRAINT "framework_control_mappings_master_control_id_fkey" FOREIGN KEY ("master_control_id") REFERENCES "public"."master_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."framework_controls"
    ADD CONSTRAINT "framework_controls_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."framework_domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."framework_controls"
    ADD CONSTRAINT "framework_controls_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."framework_domains"
    ADD CONSTRAINT "framework_domains_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "public"."frameworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."graph_nodes"
    ADD CONSTRAINT "graph_nodes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."graph_wires"
    ADD CONSTRAINT "graph_wires_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."graph_wires"
    ADD CONSTRAINT "graph_wires_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."graph_wires"
    ADD CONSTRAINT "graph_wires_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_configs"
    ADD CONSTRAINT "integration_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_event_mappings"
    ADD CONSTRAINT "integration_event_mappings_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."org_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_event_mappings"
    ADD CONSTRAINT "integration_event_mappings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_events"
    ADD CONSTRAINT "integration_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integration_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_events"
    ADD CONSTRAINT "integration_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_sync_log"
    ADD CONSTRAINT "integration_sync_log_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."org_integrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."integration_sync_log"
    ADD CONSTRAINT "integration_sync_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_hold_documents"
    ADD CONSTRAINT "legal_hold_documents_legal_hold_id_fkey" FOREIGN KEY ("legal_hold_id") REFERENCES "public"."legal_holds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_hold_documents"
    ADD CONSTRAINT "legal_hold_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_holds"
    ADD CONSTRAINT "legal_holds_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_org_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_analytics_snapshots"
    ADD CONSTRAINT "org_analytics_snapshots_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_assets"
    ADD CONSTRAINT "org_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_audit_events"
    ADD CONSTRAINT "org_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_audit_logs"
    ADD CONSTRAINT "org_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_behaviour_support_plans"
    ADD CONSTRAINT "org_behaviour_support_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_branding"
    ADD CONSTRAINT "org_branding_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_capa_events"
    ADD CONSTRAINT "org_capa_events_capa_id_fkey" FOREIGN KEY ("capa_id") REFERENCES "public"."org_capa_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_capa_events"
    ADD CONSTRAINT "org_capa_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_capa_items"
    ADD CONSTRAINT "org_capa_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_goals"
    ADD CONSTRAINT "org_care_goals_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."org_care_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_goals"
    ADD CONSTRAINT "org_care_goals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_goals"
    ADD CONSTRAINT "org_care_goals_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_care_plan_versions"
    ADD CONSTRAINT "org_care_plan_versions_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."org_care_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_plan_versions"
    ADD CONSTRAINT "org_care_plan_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_care_plan_versions"
    ADD CONSTRAINT "org_care_plan_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_plans"
    ADD CONSTRAINT "org_care_plans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_care_plans"
    ADD CONSTRAINT "org_care_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."org_patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_care_plans"
    ADD CONSTRAINT "org_care_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_care_plans"
    ADD CONSTRAINT "org_care_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_certifications"
    ADD CONSTRAINT "org_certifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_compliance_blocks"
    ADD CONSTRAINT "org_compliance_blocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_compliance_health_snapshots"
    ADD CONSTRAINT "org_compliance_health_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_compliance_status"
    ADD CONSTRAINT "org_compliance_status_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_control_evaluations"
    ADD CONSTRAINT "org_control_evaluations_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_control_evaluations"
    ADD CONSTRAINT "org_control_evaluations_framework_id_fkey" FOREIGN KEY ("framework_id") REFERENCES "public"."compliance_frameworks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_control_evaluations"
    ADD CONSTRAINT "org_control_evaluations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "public"."compliance_controls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "public"."org_evidence"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."org_policies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_control_mappings"
    ADD CONSTRAINT "org_control_mappings_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."org_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_credentials"
    ADD CONSTRAINT "org_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."org_credentials"
    ADD CONSTRAINT "org_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_entities"
    ADD CONSTRAINT "org_entities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_entitlements"
    ADD CONSTRAINT "org_entitlements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_entity_members"
    ADD CONSTRAINT "org_entity_members_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."org_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_entity_members"
    ADD CONSTRAINT "org_entity_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_linked_policy_id_fkey" FOREIGN KEY ("linked_policy_id") REFERENCES "public"."org_policies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."org_policies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_evidence"
    ADD CONSTRAINT "org_evidence_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."org_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_exports"
    ADD CONSTRAINT "org_exports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_exports"
    ADD CONSTRAINT "org_exports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_feature_toggles"
    ADD CONSTRAINT "org_feature_toggles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_files"
    ADD CONSTRAINT "org_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_files"
    ADD CONSTRAINT "org_files_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_first_session_progress"
    ADD CONSTRAINT "org_first_session_progress_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_form_submissions"
    ADD CONSTRAINT "org_form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."org_forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_form_submissions"
    ADD CONSTRAINT "org_form_submissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_forms"
    ADD CONSTRAINT "org_forms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_frameworks"
    ADD CONSTRAINT "org_frameworks_org_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_goal_progress_entries"
    ADD CONSTRAINT "org_goal_progress_entries_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."org_care_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_group_members"
    ADD CONSTRAINT "org_group_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_group_members"
    ADD CONSTRAINT "org_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."org_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_group_members"
    ADD CONSTRAINT "org_group_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_groups"
    ADD CONSTRAINT "org_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_groups"
    ADD CONSTRAINT "org_groups_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_incidents"
    ADD CONSTRAINT "org_incidents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_incidents"
    ADD CONSTRAINT "org_incidents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_industries"
    ADD CONSTRAINT "org_industries_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "public"."care_industries"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."org_industries"
    ADD CONSTRAINT "org_industries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_integrations"
    ADD CONSTRAINT "org_integrations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_investigations"
    ADD CONSTRAINT "org_investigations_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."org_incidents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_investigations"
    ADD CONSTRAINT "org_investigations_lead_investigator_id_fkey" FOREIGN KEY ("lead_investigator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_investigations"
    ADD CONSTRAINT "org_investigations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_investigations"
    ADD CONSTRAINT "org_investigations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_invites"
    ADD CONSTRAINT "org_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_medication_administrations"
    ADD CONSTRAINT "org_medication_administrations_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."org_medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_medications"
    ADD CONSTRAINT "org_medications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_medications"
    ADD CONSTRAINT "org_medications_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."org_patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_module_entitlements"
    ADD CONSTRAINT "org_module_entitlements_module_code_fkey" FOREIGN KEY ("module_code") REFERENCES "public"."app_modules"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."org_module_entitlements"
    ADD CONSTRAINT "org_module_entitlements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_ndis_line_items"
    ADD CONSTRAINT "org_ndis_line_items_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "public"."org_care_plans"("id");



ALTER TABLE ONLY "public"."org_ndis_line_items"
    ADD CONSTRAINT "org_ndis_line_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_ndis_line_items"
    ADD CONSTRAINT "org_ndis_line_items_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."org_patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_ndis_line_items"
    ADD CONSTRAINT "org_ndis_line_items_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."org_visits"("id");



ALTER TABLE ONLY "public"."org_notification_prefs"
    ADD CONSTRAINT "org_notification_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_notifications"
    ADD CONSTRAINT "org_notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_notifications"
    ADD CONSTRAINT "org_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_onboarding_status"
    ADD CONSTRAINT "org_onboarding_status_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_patient_assignments"
    ADD CONSTRAINT "org_patient_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_patient_assignments"
    ADD CONSTRAINT "org_patient_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_patient_assignments"
    ADD CONSTRAINT "org_patient_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_patients"
    ADD CONSTRAINT "org_patients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_patients"
    ADD CONSTRAINT "org_patients_primary_staff_id_fkey" FOREIGN KEY ("primary_staff_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_policies"
    ADD CONSTRAINT "org_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_progress_notes"
    ADD CONSTRAINT "org_progress_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_progress_notes"
    ADD CONSTRAINT "org_progress_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_registers"
    ADD CONSTRAINT "org_registers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_registers"
    ADD CONSTRAINT "org_registers_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."care_register_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_regulatory_notifications"
    ADD CONSTRAINT "org_regulatory_notifications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."org_incidents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_regulatory_notifications"
    ADD CONSTRAINT "org_regulatory_notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_regulatory_notifications"
    ADD CONSTRAINT "org_regulatory_notifications_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_report_generations"
    ADD CONSTRAINT "org_report_generations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_report_generations"
    ADD CONSTRAINT "org_report_generations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."org_saved_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_risks"
    ADD CONSTRAINT "org_risks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_risks"
    ADD CONSTRAINT "org_risks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_saved_reports"
    ADD CONSTRAINT "org_saved_reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_settings"
    ADD CONSTRAINT "org_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_shifts"
    ADD CONSTRAINT "org_shifts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_shifts"
    ADD CONSTRAINT "org_shifts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_staff_credentials"
    ADD CONSTRAINT "org_staff_credentials_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_subscriptions"
    ADD CONSTRAINT "org_subscriptions_plan_code_fkey" FOREIGN KEY ("plan_code") REFERENCES "public"."billing_plans"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."org_tasks"
    ADD CONSTRAINT "org_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_tasks"
    ADD CONSTRAINT "org_tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."org_patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_recurrence_parent_id_fkey" FOREIGN KEY ("recurrence_parent_id") REFERENCES "public"."org_visits"("id");



ALTER TABLE ONLY "public"."org_visits"
    ADD CONSTRAINT "org_visits_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_workflow_executions"
    ADD CONSTRAINT "org_workflow_executions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_workflow_executions"
    ADD CONSTRAINT "org_workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."org_workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_workflows"
    ADD CONSTRAINT "org_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."org_workflows"
    ADD CONSTRAINT "org_workflows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."password_history"
    ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_acknowledgments"
    ADD CONSTRAINT "policy_acknowledgments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_acknowledgments"
    ADD CONSTRAINT "policy_acknowledgments_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "public"."policy_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_approvals"
    ADD CONSTRAINT "policy_approvals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_approvals"
    ADD CONSTRAINT "policy_approvals_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "public"."policy_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_review_schedules"
    ADD CONSTRAINT "policy_review_schedules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purged_subject_redactions"
    ADD CONSTRAINT "purged_subject_redactions_purge_job_id_fkey" FOREIGN KEY ("purge_job_id") REFERENCES "public"."user_purge_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rbac_role_permissions"
    ADD CONSTRAINT "rbac_role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "public"."rbac_permissions"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rbac_role_permissions"
    ADD CONSTRAINT "rbac_role_permissions_role_key_fkey" FOREIGN KEY ("role_key") REFERENCES "public"."rbac_roles"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recent_items"
    ADD CONSTRAINT "recent_items_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registers"
    ADD CONSTRAINT "registers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_export_jobs"
    ADD CONSTRAINT "report_export_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_export_jobs"
    ADD CONSTRAINT "report_export_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_generations"
    ADD CONSTRAINT "report_generations_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."report_generations"
    ADD CONSTRAINT "report_generations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_generations"
    ADD CONSTRAINT "report_generations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."report_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."retention_policies"
    ADD CONSTRAINT "retention_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."risk_analyses"
    ADD CONSTRAINT "risk_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_findings"
    ADD CONSTRAINT "scan_findings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_findings"
    ADD CONSTRAINT "scan_findings_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "public"."compliance_scans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_tasks"
    ADD CONSTRAINT "scheduled_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_index"
    ADD CONSTRAINT "search_index_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_alerts"
    ADD CONSTRAINT "security_alerts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."security_alerts"
    ADD CONSTRAINT "security_alerts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."security_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_alerts"
    ADD CONSTRAINT "security_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_requests"
    ADD CONSTRAINT "support_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_groups"
    ADD CONSTRAINT "team_groups_parent_team_id_fkey" FOREIGN KEY ("parent_team_id") REFERENCES "public"."team_groups"("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_custom_role_id_fkey" FOREIGN KEY ("custom_role_id") REFERENCES "public"."custom_roles"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trust_packets"
    ADD CONSTRAINT "trust_packets_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."trust_packets"
    ADD CONSTRAINT "trust_packets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_current_organization_id_fkey" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_purge_jobs"
    ADD CONSTRAINT "user_purge_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_security"
    ADD CONSTRAINT "user_security_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_session_revocations"
    ADD CONSTRAINT "user_session_revocations_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_session_revocations"
    ADD CONSTRAINT "user_session_revocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_configs"
    ADD CONSTRAINT "webhook_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook_configs"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and Owners can view audit logs" ON "public"."org_audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_audit_logs"."organization_id") AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Admins can manage API alert config" ON "public"."api_alert_config" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage compliance scans" ON "public"."compliance_scans" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage integration configs" ON "public"."integration_configs" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Admins can manage integration events" ON "public"."integration_events" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage policies" ON "public"."policies" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage registers" ON "public"."registers" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage report templates" ON "public"."report_templates" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage risk analyses" ON "public"."risk_analyses" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Admins can manage scheduled tasks" ON "public"."scheduled_tasks" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage webhook configs" ON "public"."webhook_configs" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view API alert config" ON "public"."api_alert_config" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view API usage logs" ON "public"."api_usage_logs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view email logs" ON "public"."email_logs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view scheduled tasks" ON "public"."scheduled_tasks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view webhook configs" ON "public"."webhook_configs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Anyone can submit form responses" ON "public"."form_responses" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Credential visibility" ON "public"."org_credentials" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "Members can create report generations in their org" ON "public"."report_generations" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Members can insert audit logs" ON "public"."org_audit_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_audit_logs"."organization_id")))));



CREATE POLICY "Members can manage tasks in their org" ON "public"."tasks" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Org admins can manage trust packets" ON "public"."trust_packets" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."organization_id" = "trust_packets"."org_id") AND ("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."organization_id" = "trust_packets"."org_id") AND ("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Org admins create exports" ON "public"."org_exports" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins delete assets" ON "public"."org_assets" FOR DELETE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins delete risks" ON "public"."org_risks" FOR DELETE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins insert assets" ON "public"."org_assets" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins insert risks" ON "public"."org_risks" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins manage compliance blocks" ON "public"."org_compliance_blocks" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins manage compliance status" ON "public"."org_compliance_status" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "Org admins update assets" ON "public"."org_assets" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org admins update compliance blocks" ON "public"."org_compliance_blocks" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "Org admins update compliance status" ON "public"."org_compliance_status" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'manager'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text", 'manager'::"text"]))))));



CREATE POLICY "Org admins update risks" ON "public"."org_risks" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "Org members read compliance blocks" ON "public"."org_compliance_blocks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org members read compliance status" ON "public"."org_compliance_status" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org members view assets" ON "public"."org_assets" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org members view compliance blocks" ON "public"."org_compliance_blocks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org members view exports" ON "public"."org_exports" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org members view risks" ON "public"."org_risks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Org owners/admins can create invitations" ON "public"."team_invitations" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Org owners/admins can update invitations" ON "public"."team_invitations" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Unified Asset Access" ON "public"."org_assets" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_assets"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "m"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Unified Log Access" ON "public"."org_audit_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_audit_logs"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "m"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Unified Policy Access" ON "public"."org_policies" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_policies"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "m"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Unified Task Access" ON "public"."org_tasks" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_tasks"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "m"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can create comments in their org" ON "public"."comments" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can create forms in their org" ON "public"."forms" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can create reports in their org" ON "public"."reports" FOR INSERT WITH CHECK ((("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can delete forms in their org" ON "public"."forms" FOR DELETE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own notification prefs" ON "public"."notification_preferences" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage dashboard layouts in their org" ON "public"."dashboard_layouts" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage file metadata in their org" ON "public"."file_metadata" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage file versions in their org" ON "public"."file_versions" USING (("file_id" IN ( SELECT "file_metadata"."id"
   FROM "public"."file_metadata"
  WHERE ("file_metadata"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"())))))) WITH CHECK (("file_id" IN ( SELECT "file_metadata"."id"
   FROM "public"."file_metadata"
  WHERE ("file_metadata"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage their own email preferences" ON "public"."email_preferences" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own reactions" ON "public"."comment_reactions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can only see their own org tasks" ON "public"."org_tasks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can read their own membership rows" ON "public"."memberships" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update forms in their org" ON "public"."forms" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view AI insights in their org" ON "public"."ai_insights" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view comments in their org" ON "public"."comments" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view compliance scans in their org" ON "public"."compliance_scans" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view dashboard layouts in their org" ON "public"."dashboard_layouts" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view file metadata in their org" ON "public"."file_metadata" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view file versions in their org" ON "public"."file_versions" FOR SELECT USING (("file_id" IN ( SELECT "file_metadata"."id"
   FROM "public"."file_metadata"
  WHERE ("file_metadata"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view forms in their org" ON "public"."forms" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view integration configs in their org" ON "public"."integration_configs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view integration events in their org" ON "public"."integration_events" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view invitations in their org" ON "public"."team_invitations" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view org workflows" ON "public"."org_workflows" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view own notification prefs" ON "public"."notification_preferences" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view policies in their org" ON "public"."policies" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view reactions in their org" ON "public"."comment_reactions" FOR SELECT USING (("comment_id" IN ( SELECT "comments"."id"
   FROM "public"."comments"
  WHERE ("comments"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view registers in their org" ON "public"."registers" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view report generations in their org" ON "public"."report_generations" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view report templates in their org" ON "public"."report_templates" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view reports in their org" ON "public"."reports" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view responses in their org" ON "public"."form_responses" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view risk analyses in their org" ON "public"."risk_analyses" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view scan findings in their org" ON "public"."scan_findings" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view tasks in their org" ON "public"."tasks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own email preferences" ON "public"."email_preferences" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view workflow executions" ON "public"."org_workflow_executions" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Valid tokens are publicly readable" ON "public"."trust_packets" FOR SELECT USING ((("expires_at" > "now"()) AND ("revoked_at" IS NULL)));



CREATE POLICY "View Assets" ON "public"."org_assets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_assets"."organization_id")))));



CREATE POLICY "View Policies" ON "public"."org_policies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_policies"."organization_id")))));



CREATE POLICY "View Tasks" ON "public"."org_tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."organization_id" = "org_tasks"."organization_id")))));



ALTER TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."active_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "active_sessions_block_anon" ON "public"."active_sessions" TO "anon" USING (false) WITH CHECK (false);



CREATE POLICY "active_sessions_service_role" ON "public"."active_sessions" AS RESTRICTIVE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "active_sessions_user_read" ON "public"."active_sessions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_audit_log_admin" ON "public"."admin_audit_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "admin_audit_log_no_delete" ON "public"."admin_audit_log" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "admin_audit_log_no_update" ON "public"."admin_audit_log" AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);



ALTER TABLE "public"."admin_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_jobs_service_only" ON "public"."admin_jobs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_notes_admin" ON "public"."admin_notes" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."ai_document_embeddings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_embeddings_org_isolation" ON "public"."ai_document_embeddings" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ai_index_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_index_status_org_isolation" ON "public"."ai_index_status" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_org_isolation" ON "public"."ai_usage_log" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."api_alert_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_key_usage_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_key_usage_log_org_members_select" ON "public"."api_key_usage_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "api_key_usage_log"."org_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "api_key_usage_log_org_select" ON "public"."api_key_usage_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "api_key_usage_log"."org_id") AND ("om"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_keys_org_admins_manage" ON "public"."api_keys" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "api_keys"."org_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "api_keys"."org_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "api_keys_org_members_select" ON "public"."api_keys" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "api_keys"."org_id") AND ("om"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."api_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_chain_anchors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_chain_anchors_no_delete" ON "public"."audit_chain_anchors" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "audit_chain_anchors_no_update" ON "public"."audit_chain_anchors" AS RESTRICTIVE FOR UPDATE USING (false);



CREATE POLICY "audit_chain_anchors_select_org_members" ON "public"."audit_chain_anchors" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "audit_chain_anchors"."org_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."audit_chain_secrets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_chain_secrets_deny_all" ON "public"."audit_chain_secrets" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "audit_chain_secrets_no_update" ON "public"."audit_chain_secrets" AS RESTRICTIVE FOR UPDATE USING (false);



CREATE POLICY "audit_events_org_isolation" ON "public"."org_audit_events" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."audit_export_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_exports_org" ON "public"."audit_export_jobs" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_no_delete" ON "public"."audit_log" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "audit_log_no_update" ON "public"."audit_log" AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "audit_log_org" ON "public"."audit_log" FOR SELECT USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "audit_log_org_isolation" ON "public"."org_audit_logs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "audit_log_service_only" ON "public"."audit_log" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "audit_logs_read_access" ON "public"."org_audit_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "audit_logs_write_access" ON "public"."org_audit_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."audit_retention_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_retention_org" ON "public"."audit_retention_config" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."auditor_access_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auditor_access_tokens_delete" ON "public"."auditor_access_tokens" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_access_tokens_insert" ON "public"."auditor_access_tokens" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_access_tokens_select" ON "public"."auditor_access_tokens" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_access_tokens_update" ON "public"."auditor_access_tokens" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."auditor_activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auditor_activity_log_delete" ON "public"."auditor_activity_log" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_activity_log_insert" ON "public"."auditor_activity_log" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_activity_log_select" ON "public"."auditor_activity_log" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "auditor_activity_log_update" ON "public"."auditor_activity_log" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."billing_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_events_admin" ON "public"."billing_events" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."billing_events_audit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_events_audit_block_writes" ON "public"."billing_events_audit" AS RESTRICTIVE FOR INSERT TO "authenticated", "anon" WITH CHECK (false);



CREATE POLICY "billing_events_audit_org_member_select" ON "public"."billing_events_audit" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "billing_events_audit"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



ALTER TABLE "public"."billing_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_reconciliation_admin" ON "public"."billing_reconciliation_log" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "billing_reconciliation_log"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = 'owner'::"text"))))) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."billing_reconciliation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."care_industries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "care_plans_org_isolation" ON "public"."org_care_plans" TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."care_policy_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."care_register_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."care_service_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."care_task_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_controls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_export_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_frameworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_playbook_controls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_playbooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_scans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_score_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."control_evidence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "control_evidence_org_member_select" ON "public"."control_evidence" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_evidence"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "control_evidence_org_writer_delete" ON "public"."control_evidence" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_evidence"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "control_evidence_org_writer_insert" ON "public"."control_evidence" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_evidence"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "control_evidence_org_writer_update" ON "public"."control_evidence" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_evidence"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



ALTER TABLE "public"."control_group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."control_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."control_mappings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "control_mappings_service_role" ON "public"."control_mappings" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."control_tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "control_tasks_org_member_select" ON "public"."control_tasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_tasks"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "control_tasks_org_writer_delete" ON "public"."control_tasks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_tasks"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "control_tasks_org_writer_insert" ON "public"."control_tasks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_tasks"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "control_tasks_org_writer_update" ON "public"."control_tasks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "control_tasks"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "controls_select_all" ON "public"."compliance_controls" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "crossmap_read_all" ON "public"."framework_control_mappings" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."custom_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_roles_org" ON "public"."custom_roles" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."dashboard_layouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_layouts_owner" ON "public"."dashboard_layouts" USING ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."dashboard_widget_registry" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "doc_lifecycle_org" ON "public"."document_lifecycle_log" USING (("org_id" IN ( SELECT "document_lifecycle_log"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "document_lifecycle_log"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."document_lifecycle_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dormant_user_purge_holds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dormant_user_purge_holds_deny_all" ON "public"."dormant_user_purge_holds" TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."dormant_user_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dormant_user_reviews_deny_all" ON "public"."dormant_user_reviews" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "dormant_user_reviews_no_delete" ON "public"."dormant_user_reviews" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "dormant_user_reviews_no_update" ON "public"."dormant_user_reviews" AS RESTRICTIVE FOR UPDATE USING (false);



ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_preferences_unified" ON "public"."email_preferences" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."enterprise_export_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enterprise_export_owner_insert" ON "public"."enterprise_export_jobs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "enterprise_export_jobs"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = 'owner'::"text")))));



CREATE POLICY "enterprise_export_owner_select" ON "public"."enterprise_export_jobs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "enterprise_export_jobs"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = 'owner'::"text")))));



CREATE POLICY "enterprise_export_service_update" ON "public"."enterprise_export_jobs" FOR UPDATE USING (((( SELECT "auth"."role"() AS "role") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "enterprise_export_jobs"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "enterprise_export_jobs"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "evals_insert_privileged" ON "public"."org_control_evaluations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_evaluations"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "evals_select_org_members" ON "public"."org_control_evaluations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_evaluations"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "event_mappings_org" ON "public"."integration_event_mappings" USING (("org_id" IN ( SELECT "integration_event_mappings"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "integration_event_mappings"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "export_jobs_insert" ON "public"."compliance_export_jobs" FOR INSERT WITH CHECK ((("requested_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "export_jobs_select" ON "public"."compliance_export_jobs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "export_jobs_service_role" ON "public"."compliance_export_jobs" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feature_flags_service_only" ON "public"."feature_flags" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."file_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."file_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."framework_control_mappings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "framework_control_mappings_unified" ON "public"."framework_control_mappings" FOR SELECT USING (((( SELECT "auth"."role"() AS "role") = 'service_role'::"text") OR (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



ALTER TABLE "public"."framework_controls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "framework_controls_service_role" ON "public"."framework_controls" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."framework_domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "framework_domains_service_role" ON "public"."framework_domains" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."frameworks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "frameworks_select_all" ON "public"."compliance_frameworks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "frameworks_service_role" ON "public"."frameworks" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."graph_nodes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "graph_nodes_no_delete" ON "public"."graph_nodes" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "graph_nodes_no_insert" ON "public"."graph_nodes" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "graph_nodes_no_update" ON "public"."graph_nodes" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "graph_nodes_select_org_members" ON "public"."graph_nodes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "graph_nodes"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."graph_wires" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "graph_wires_no_delete" ON "public"."graph_wires" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "graph_wires_no_insert" ON "public"."graph_wires" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "graph_wires_no_update" ON "public"."graph_wires" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "graph_wires_select_org_members" ON "public"."graph_wires" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "graph_wires"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "group_members_read_all" ON "public"."control_group_members" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "groups_read_all" ON "public"."control_groups" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."integration_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_event_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integration_sync_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitations_self_accept" ON "public"."team_invitations" FOR UPDATE USING ((("email" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text")) OR ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "invitations_self_select" ON "public"."team_invitations" FOR SELECT USING ((("email" = (( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text")) OR ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "legal_hold_docs_org" ON "public"."legal_hold_documents" USING (("org_id" IN ( SELECT "legal_hold_documents"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "legal_hold_documents"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."legal_hold_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_holds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "legal_holds_org" ON "public"."legal_holds" USING (("org_id" IN ( SELECT "legal_holds"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "legal_holds"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."marketing_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketing_config_service_only" ON "public"."marketing_config" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."marketing_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "marketing_leads_insert" ON "public"."marketing_leads" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."master_controls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_controls_select" ON "public"."master_controls" FOR SELECT USING (true);



CREATE POLICY "master_controls_service_role" ON "public"."master_controls" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "members_admin_delete" ON "public"."org_members" FOR DELETE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."current_user_admin_org_ids"() "current_user_admin_org_ids"("current_user_admin_org_ids"))));



CREATE POLICY "members_admin_insert" ON "public"."org_members" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."current_user_admin_org_ids"() "current_user_admin_org_ids"("current_user_admin_org_ids"))));



CREATE POLICY "members_admin_update" ON "public"."org_members" FOR UPDATE USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."current_user_admin_org_ids"() "current_user_admin_org_ids"("current_user_admin_org_ids"))));



CREATE POLICY "members_org_access" ON "public"."org_members" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."current_user_org_ids"() "current_user_org_ids"("current_user_org_ids"))));



CREATE POLICY "members_self_access" ON "public"."org_members" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notif_insert_member" ON "public"."org_notifications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "m"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "notif_select_own" ON "public"."org_notifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "notif_update_own" ON "public"."org_notifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_update_own" ON "public"."org_notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "ocm_delete_privileged" ON "public"."org_control_mappings" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_mappings"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "ocm_insert_privileged" ON "public"."org_control_mappings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_mappings"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "ocm_select_org_members" ON "public"."org_control_mappings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_mappings"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "ocm_update_privileged" ON "public"."org_control_mappings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_mappings"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_mappings"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "org members can read control mappings" ON "public"."org_control_mappings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members"
  WHERE (("org_members"."organization_id" = "org_control_mappings"."organization_id") AND ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."org_analytics_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_analytics_snapshots_delete" ON "public"."org_analytics_snapshots" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_analytics_snapshots_insert" ON "public"."org_analytics_snapshots" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_analytics_snapshots_select" ON "public"."org_analytics_snapshots" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_analytics_snapshots_update" ON "public"."org_analytics_snapshots" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_audit_logs_no_delete" ON "public"."org_audit_logs" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "org_audit_logs_no_update" ON "public"."org_audit_logs" AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);



ALTER TABLE "public"."org_behaviour_support_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_behaviour_support_plans_delete_privileged" ON "public"."org_behaviour_support_plans" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_behaviour_support_plans"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "org_behaviour_support_plans_insert_org_members" ON "public"."org_behaviour_support_plans" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_behaviour_support_plans"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "org_behaviour_support_plans_select_org_members" ON "public"."org_behaviour_support_plans" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_behaviour_support_plans"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "org_behaviour_support_plans_update_privileged" ON "public"."org_behaviour_support_plans" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_behaviour_support_plans"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'compliance_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_behaviour_support_plans"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'compliance_admin'::"text"]))))));



ALTER TABLE "public"."org_branding" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_branding_org" ON "public"."org_branding" USING (("org_id" IN ( SELECT "org_branding"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_branding"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_capa_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_capa_events_delete" ON "public"."org_capa_events" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_events_insert" ON "public"."org_capa_events" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_events_select" ON "public"."org_capa_events" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_events_update" ON "public"."org_capa_events" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_capa_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_capa_items_delete" ON "public"."org_capa_items" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_items_insert" ON "public"."org_capa_items" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_items_org_isolation" ON "public"."org_capa_items" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_items_select" ON "public"."org_capa_items" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_capa_items_update" ON "public"."org_capa_items" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_care_goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_care_goals_delete" ON "public"."org_care_goals" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_care_goals_insert" ON "public"."org_care_goals" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_care_goals_select" ON "public"."org_care_goals" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_care_goals_update" ON "public"."org_care_goals" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_care_plan_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_care_plan_versions_select" ON "public"."org_care_plan_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."organization_id" = "org_care_plan_versions"."organization_id")))));



ALTER TABLE "public"."org_care_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_certifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_certifications_org_member_select" ON "public"."org_certifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_certifications"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "org_certifications_org_writer_delete" ON "public"."org_certifications" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_certifications"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "org_certifications_org_writer_insert" ON "public"."org_certifications" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_certifications"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_certifications_org_writer_update" ON "public"."org_certifications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_certifications"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



ALTER TABLE "public"."org_compliance_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_compliance_health_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_compliance_health_snapshots_no_delete" ON "public"."org_compliance_health_snapshots" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "org_compliance_health_snapshots_no_update" ON "public"."org_compliance_health_snapshots" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "org_compliance_health_snapshots_no_write" ON "public"."org_compliance_health_snapshots" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "org_compliance_health_snapshots_select_org_members" ON "public"."org_compliance_health_snapshots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_compliance_health_snapshots"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."org_compliance_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_control_evaluations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_control_evaluations_delete_privileged" ON "public"."org_control_evaluations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_evaluations"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "org_control_evaluations_insert" ON "public"."org_control_evaluations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_control_evaluations_select" ON "public"."org_control_evaluations" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_control_evaluations_update_privileged" ON "public"."org_control_evaluations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_evaluations"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_control_evaluations"."organization_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."org_control_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_entities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_entities_org_member_select" ON "public"."org_entities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entities"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "org_entities_org_writer_delete" ON "public"."org_entities" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entities"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "org_entities_org_writer_insert" ON "public"."org_entities" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entities"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_entities_org_writer_update" ON "public"."org_entities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entities"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



ALTER TABLE "public"."org_entitlements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_entitlements_admin" ON "public"."org_entitlements" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "org_entitlements_select" ON "public"."org_entitlements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_entitlements"."organization_id")))));



ALTER TABLE "public"."org_entity_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_entity_members_org_member_select" ON "public"."org_entity_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entity_members"."organization_id") AND ("om"."user_id" = "auth"."uid"())))));



CREATE POLICY "org_entity_members_org_writer_delete" ON "public"."org_entity_members" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entity_members"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



CREATE POLICY "org_entity_members_org_writer_insert" ON "public"."org_entity_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entity_members"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_entity_members_org_writer_update" ON "public"."org_entity_members" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "org_entity_members"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))));



ALTER TABLE "public"."org_evidence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_evidence_org_isolation" ON "public"."org_evidence" TO "authenticated" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."org_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_feature_toggles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_feature_toggles_org" ON "public"."org_feature_toggles" USING (("org_id" IN ( SELECT "org_feature_toggles"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_feature_toggles"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_first_session_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_first_session_progress_insert" ON "public"."org_first_session_progress" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_first_session_progress"."organization_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "org_first_session_progress_select" ON "public"."org_first_session_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_first_session_progress"."organization_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "org_first_session_progress_update" ON "public"."org_first_session_progress" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."organization_id" = "org_first_session_progress"."organization_id") AND ("m"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."org_form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_form_submissions_insert" ON "public"."org_form_submissions" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."org_forms" "f"
  WHERE (("f"."id" = "org_form_submissions"."form_id") AND ("f"."status" = 'published'::"text") AND ((("f"."settings" ->> 'requires_auth'::"text"))::boolean IS NOT TRUE))))));



CREATE POLICY "org_form_submissions_select" ON "public"."org_form_submissions" FOR SELECT USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_form_submissions_update" ON "public"."org_form_submissions" FOR UPDATE USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_form_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_form_templates_select" ON "public"."org_form_templates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."org_forms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_forms_delete" ON "public"."org_forms" FOR DELETE USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_forms_insert" ON "public"."org_forms" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_forms_select" ON "public"."org_forms" FOR SELECT USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_forms_update" ON "public"."org_forms" FOR UPDATE USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_frameworks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_frameworks_manage" ON "public"."org_frameworks" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "org_frameworks_select" ON "public"."org_frameworks" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_goal_progress_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_goal_progress_entries_delete" ON "public"."org_goal_progress_entries" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_goal_progress_entries_insert" ON "public"."org_goal_progress_entries" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_goal_progress_entries_select" ON "public"."org_goal_progress_entries" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_goal_progress_entries_update" ON "public"."org_goal_progress_entries" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_group_members_parent_admin" ON "public"."org_group_members" USING (("group_id" IN ( SELECT "org_groups"."id"
   FROM "public"."org_groups"
  WHERE ("org_groups"."parent_org_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))))) WITH CHECK (("group_id" IN ( SELECT "org_groups"."id"
   FROM "public"."org_groups"
  WHERE ("org_groups"."parent_org_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))))));



ALTER TABLE "public"."org_groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_groups_parent_admin" ON "public"."org_groups" USING (("parent_org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("parent_org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."org_incidents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_incidents_insert" ON "public"."org_incidents" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_incidents"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_incidents_select" ON "public"."org_incidents" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_incidents"."organization_id")))));



CREATE POLICY "org_incidents_update" ON "public"."org_incidents" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_incidents"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_incidents"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



ALTER TABLE "public"."org_industries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_integrations_org" ON "public"."org_integrations" USING (("org_id" IN ( SELECT "org_integrations"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_integrations"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_investigations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_investigations_org_isolation" ON "public"."org_investigations" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_invites_insert" ON "public"."org_invites" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_invites"."organization_id")))));



CREATE POLICY "org_invites_select" ON "public"."org_invites" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_invites"."organization_id")))));



ALTER TABLE "public"."org_medication_administrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_medication_administrations_delete" ON "public"."org_medication_administrations" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medication_administrations_insert" ON "public"."org_medication_administrations" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medication_administrations_select" ON "public"."org_medication_administrations" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medication_administrations_update" ON "public"."org_medication_administrations" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_medications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_medications_delete" ON "public"."org_medications" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medications_insert" ON "public"."org_medications" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medications_select" ON "public"."org_medications" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_medications_update" ON "public"."org_medications" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_module_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_ndis_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_ndis_line_items_delete" ON "public"."org_ndis_line_items" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_ndis_line_items_insert" ON "public"."org_ndis_line_items" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_ndis_line_items_select" ON "public"."org_ndis_line_items" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_ndis_line_items_update" ON "public"."org_ndis_line_items" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_ndis_price_guide" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_ndis_price_guide_read" ON "public"."org_ndis_price_guide" FOR SELECT USING (true);



ALTER TABLE "public"."org_notification_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_onboarding_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_onboarding_status_insert" ON "public"."org_onboarding_status" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_onboarding_status"."organization_id")))));



CREATE POLICY "org_onboarding_status_select" ON "public"."org_onboarding_status" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_onboarding_status"."organization_id")))));



CREATE POLICY "org_onboarding_status_update" ON "public"."org_onboarding_status" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_onboarding_status"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_onboarding_status"."organization_id")))));



ALTER TABLE "public"."org_patient_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_patient_assignments_admin_all" ON "public"."org_patient_assignments" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "org_patient_assignments_member_select" ON "public"."org_patient_assignments" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_patient_assignments_own_select" ON "public"."org_patient_assignments" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."org_patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_patients_insert" ON "public"."org_patients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_patients"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_patients_select" ON "public"."org_patients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_patients"."organization_id")))));



CREATE POLICY "org_patients_update" ON "public"."org_patients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_patients"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_patients"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



ALTER TABLE "public"."org_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_progress_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_progress_notes_insert" ON "public"."org_progress_notes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_progress_notes"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_progress_notes_select" ON "public"."org_progress_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_progress_notes"."organization_id")))));



CREATE POLICY "org_progress_notes_update" ON "public"."org_progress_notes" FOR UPDATE USING ((("signed_off_by" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."organization_id" = "org_progress_notes"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"]))))))) WITH CHECK ((("signed_off_by" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."organization_id" = "org_progress_notes"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text"])))))));



ALTER TABLE "public"."org_registers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_regulatory_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_regulatory_notifications_org_isolation" ON "public"."org_regulatory_notifications" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_report_generations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_report_generations_delete" ON "public"."org_report_generations" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_report_generations_insert" ON "public"."org_report_generations" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_report_generations_select" ON "public"."org_report_generations" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_report_generations_update" ON "public"."org_report_generations" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_risks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_saved_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_saved_reports_delete" ON "public"."org_saved_reports" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_saved_reports_insert" ON "public"."org_saved_reports" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_saved_reports_select" ON "public"."org_saved_reports" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_saved_reports_update" ON "public"."org_saved_reports" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_settings_org_isolation" ON "public"."org_settings" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."org_shifts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_shifts_insert" ON "public"."org_shifts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_shifts"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



CREATE POLICY "org_shifts_select" ON "public"."org_shifts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_shifts"."organization_id")))));



CREATE POLICY "org_shifts_update" ON "public"."org_shifts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_shifts"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_shifts"."organization_id") AND ("m"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'compliance_officer'::"text", 'staff'::"text", 'member'::"text"]))))));



ALTER TABLE "public"."org_staff_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_subscriptions_admin" ON "public"."org_subscriptions" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "org_subscriptions_select" ON "public"."org_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "org_subscriptions"."organization_id")))));



ALTER TABLE "public"."org_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_usage_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_workflow_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orgs_user_isolation" ON "public"."organizations" FOR SELECT USING (("id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."password_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "password_history_service" ON "public"."password_history" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_admin" ON "public"."plans" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "plans_select" ON "public"."plans" FOR SELECT USING (true);



ALTER TABLE "public"."platform_security_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platform_security_audit_log_deny_all" ON "public"."platform_security_audit_log" USING (false) WITH CHECK (false);



ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_acknowledgments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policy_acks_org" ON "public"."policy_acknowledgments" TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."policy_approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policy_approvals_org" ON "public"."policy_approvals" TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "policy_review_org" ON "public"."policy_review_schedules" TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."policy_review_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policy_versions_org" ON "public"."policy_versions" TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "prefs_insert_own" ON "public"."org_notification_prefs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "prefs_select_own" ON "public"."org_notification_prefs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "prefs_update_own" ON "public"."org_notification_prefs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."product_releases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_releases_admin" ON "public"."product_releases" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."purged_subject_redactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purged_subject_redactions_no_delete" ON "public"."purged_subject_redactions" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "purged_subject_redactions_no_update" ON "public"."purged_subject_redactions" AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "purged_subject_redactions_service_only" ON "public"."purged_subject_redactions" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "push_tokens_own" ON "public"."push_tokens" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."rate_limit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rate_limit_log_service" ON "public"."rate_limit_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."rbac_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rbac_role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rbac_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recent_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recent_items_delete" ON "public"."recent_items" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "recent_items_insert" ON "public"."recent_items" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "recent_items_select" ON "public"."recent_items" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "recent_items_update" ON "public"."recent_items" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."registers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_export_insert" ON "public"."report_export_jobs" FOR INSERT WITH CHECK ((("requested_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



ALTER TABLE "public"."report_export_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_export_select" ON "public"."report_export_jobs" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "report_export_service_role" ON "public"."report_export_jobs" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."report_generations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restore_test_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "restore_test_runs_deny_all" ON "public"."restore_test_runs" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "restore_test_runs_no_delete" ON "public"."restore_test_runs" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "restore_test_runs_no_update" ON "public"."restore_test_runs" AS RESTRICTIVE FOR UPDATE USING (false);



ALTER TABLE "public"."retention_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "retention_policies_org" ON "public"."retention_policies" USING (("org_id" IN ( SELECT "retention_policies"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "retention_policies"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."risk_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_searches_delete" ON "public"."saved_searches" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "saved_searches_insert" ON "public"."saved_searches" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "saved_searches_select" ON "public"."saved_searches" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "saved_searches_update" ON "public"."saved_searches" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."scan_findings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_history_delete" ON "public"."search_history" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_history_insert" ON "public"."search_history" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_history_select" ON "public"."search_history" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_history_update" ON "public"."search_history" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."search_index" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_index_delete" ON "public"."search_index" FOR DELETE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_index_insert" ON "public"."search_index" FOR INSERT TO "authenticated" WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_index_select" ON "public"."search_index" FOR SELECT TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "search_index_update" ON "public"."search_index" FOR UPDATE TO "authenticated" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."secret_rotations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "secret_rotations_deny_all" ON "public"."secret_rotations" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "secret_rotations_no_delete" ON "public"."secret_rotations" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "secret_rotations_no_update" ON "public"."secret_rotations" AS RESTRICTIVE FOR UPDATE USING (false);



ALTER TABLE "public"."security_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_alerts_block_users" ON "public"."security_alerts" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "security_alerts_service_role" ON "public"."security_alerts" AS RESTRICTIVE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_audit_log_insert" ON "public"."security_audit_log" FOR INSERT WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "security_audit_log_no_delete" ON "public"."security_audit_log" AS RESTRICTIVE FOR DELETE USING (false);



CREATE POLICY "security_audit_log_no_update" ON "public"."security_audit_log" AS RESTRICTIVE FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "security_audit_log_select" ON "public"."security_audit_log" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."org_members" "om"
  WHERE (("om"."organization_id" = "security_audit_log"."organization_id") AND ("om"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (( SELECT "auth"."role"() AS "role") = 'service_role'::"text")));



ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_events_block_users" ON "public"."security_events" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "security_events_service_role" ON "public"."security_events" AS RESTRICTIVE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "snapshots_select" ON "public"."compliance_score_snapshots" FOR SELECT USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "snapshots_service_role" ON "public"."compliance_score_snapshots" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "staff_credentials_org_isolation" ON "public"."org_staff_credentials" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."support_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "support_requests_admin" ON "public"."support_requests" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "sync_log_org" ON "public"."integration_sync_log" USING (("org_id" IN ( SELECT "integration_sync_log"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "integration_sync_log"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_settings_service_only" ON "public"."system_settings" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_comments_org_access" ON "public"."task_comments" USING (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"())))))) WITH CHECK (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."task_dependencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_deps_org_access" ON "public"."task_dependencies" USING (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"())))))) WITH CHECK (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."task_recurrence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_recurrence_org_access" ON "public"."task_recurrence" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."task_time_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_time_org_access" ON "public"."task_time_entries" USING (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"())))))) WITH CHECK (("task_id" IN ( SELECT "org_tasks"."id"
   FROM "public"."org_tasks"
  WHERE ("org_tasks"."organization_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_groups_org" ON "public"."team_groups" USING (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."team_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_invitations_manage_own_org" ON "public"."team_invitations" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE (("org_members"."user_id" = "auth"."uid"()) AND ("org_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "team_invitations_view_own_by_email" ON "public"."team_invitations" FOR SELECT USING (("email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text"));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_org" ON "public"."team_members" USING (("team_id" IN ( SELECT "team_groups"."id"
   FROM "public"."team_groups"
  WHERE ("team_groups"."org_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"())))))) WITH CHECK (("team_id" IN ( SELECT "team_groups"."id"
   FROM "public"."team_groups"
  WHERE ("team_groups"."org_id" IN ( SELECT "org_members"."organization_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."trust_packets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usage_events_admin" ON "public"."org_usage_events" FOR SELECT USING (false);



CREATE POLICY "usage_summaries_admin" ON "public"."org_usage_summaries" FOR SELECT USING (false);



ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_activity_block_anon" ON "public"."user_activity" TO "anon" USING (false) WITH CHECK (false);



CREATE POLICY "user_activity_service_role" ON "public"."user_activity" AS RESTRICTIVE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "user_activity_user_read" ON "public"."user_activity" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_self_delete" ON "public"."user_preferences" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_preferences_self_insert" ON "public"."user_preferences" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_preferences_self_select" ON "public"."user_preferences" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_preferences_self_update" ON "public"."user_preferences" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_insert" ON "public"."user_profiles" FOR INSERT WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "user_profiles"."organization_id"))))));



CREATE POLICY "user_profiles_select" ON "public"."user_profiles" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_profiles_update" ON "public"."user_profiles" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."org_members" "m"
  WHERE (("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("m"."organization_id" = "user_profiles"."organization_id"))))));



ALTER TABLE "public"."user_purge_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_purge_jobs_service_only" ON "public"."user_purge_jobs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."user_security" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_security_self_select" ON "public"."user_security" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_security_self_update" ON "public"."user_security" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_session_revocations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_session_revocations_service_only" ON "public"."user_session_revocations" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_sessions_unified" ON "public"."user_sessions" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "visits_org_isolation" ON "public"."org_visits" USING (("organization_id" IN ( SELECT "org_members"."organization_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."webhook_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."_audit_log_compute_hash_v2"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_created_at" timestamp with time zone, "p_prev_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_audit_log_compute_hash_v2"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_created_at" timestamp with time zone, "p_prev_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_audit_log_compute_hash_v2"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_created_at" timestamp with time zone, "p_prev_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."_audit_org_control_evaluation_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_audit_org_control_evaluation_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."_audit_rls_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_audit_rls_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."_fos_revoke_api_keys_for_demoted_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_fos_revoke_api_keys_for_demoted_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."_fos_revoke_api_keys_for_removed_member"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_fos_revoke_api_keys_for_removed_member"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."_touch_user_preferences_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_touch_user_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_log_append"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_log_append"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."audit_log_append_v3"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone, "p_hmac_key" "bytea") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_log_append_v3"("p_id" "uuid", "p_org_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_resource_type" "text", "p_resource_id" "uuid", "p_details" "jsonb", "p_ip_address" "text", "p_user_agent" "text", "p_created_at" timestamp with time zone, "p_hmac_key" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."bootstrap_org_from_library"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bootstrap_org_from_library"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bootstrap_org_from_library"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."care_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."care_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."care_set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."compliance_export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."compliance_export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_export_jobs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_compliance_export_jobs"("p_limit" integer, "p_worker_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_compliance_export_jobs"("p_limit" integer, "p_worker_id" "text") TO "service_role";



GRANT ALL ON TABLE "public"."enterprise_export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."enterprise_export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."enterprise_export_jobs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_enterprise_export_jobs"("p_limit" integer, "p_worker_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_enterprise_export_jobs"("p_limit" integer, "p_worker_id" "text") TO "service_role";



GRANT ALL ON TABLE "public"."report_export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."report_export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."report_export_jobs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_report_export_jobs"("p_limit" integer, "p_worker_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_report_export_jobs"("p_limit" integer, "p_worker_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_old_security_data"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_old_security_data"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_backup_code_hash"("p_user_id" "uuid", "p_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_backup_code_hash"("p_user_id" "uuid", "p_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."control_plane_prevent_audit_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."control_plane_prevent_audit_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."control_plane_prevent_audit_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."control_plane_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."control_plane_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."control_plane_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_email_preferences_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_email_preferences_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_email_preferences_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invite"("p_org_id" "uuid", "p_email" "text", "p_role" "public"."org_role", "p_days_valid" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_invite"("p_org_id" "uuid", "p_email" "text", "p_role" "public"."org_role", "p_days_valid" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invite"("p_org_id" "uuid", "p_email" "text", "p_role" "public"."org_role", "p_days_valid" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_prefs_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_prefs_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_prefs_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_org"("p_name" "text", "p_slug" "text", "p_primary_industry_code" "text", "p_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_org"("p_name" "text", "p_slug" "text", "p_primary_industry_code" "text", "p_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_org"("p_name" "text", "p_slug" "text", "p_primary_industry_code" "text", "p_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_security_alert"("p_event_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_security_alert"("p_event_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_security_alert"("p_event_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_admin_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_admin_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_admin_org_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_org_ids"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_user_profile_from_org_member"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_user_profile_from_org_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_master_control"("p_title" "text", "p_description" "text", "p_risk_level" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_master_control"("p_title" "text", "p_description" "text", "p_risk_level" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_master_control"("p_title" "text", "p_description" "text", "p_risk_level" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_renewal_tasks"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_renewal_tasks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_renewal_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("p_org" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."latest_restore_test_run"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."latest_restore_test_run"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_migration_ledger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_migration_ledger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_security_definer_anon_grants"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_security_definer_anon_grants"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_email_send"("p_email_type" "text", "p_recipient_email" "text", "p_subject" "text", "p_status" "text", "p_resend_id" "text", "p_error_message" "text", "p_metadata" "jsonb", "p_organization_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_email_send"("p_email_type" "text", "p_recipient_email" "text", "p_subject" "text", "p_status" "text", "p_resend_id" "text", "p_error_message" "text", "p_metadata" "jsonb", "p_organization_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_email_send"("p_email_type" "text", "p_recipient_email" "text", "p_subject" "text", "p_status" "text", "p_resend_id" "text", "p_error_message" "text", "p_metadata" "jsonb", "p_organization_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_generic_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_generic_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_generic_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_policy_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_policy_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_policy_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."my_org_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_org_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_org_ids"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."org_care_plans_snapshot_version"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."org_care_plans_snapshot_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."org_progress_notes_block_signed_updates"() TO "anon";
GRANT ALL ON FUNCTION "public"."org_progress_notes_block_signed_updates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."org_progress_notes_block_signed_updates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_audit_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_audit_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_audit_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_org_control_evaluations_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_org_control_evaluations_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_org_control_evaluations_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_restore_test_run"("p_performed_by" "text", "p_outcome" "text", "p_rpo_target_minutes" integer, "p_rto_target_minutes" integer, "p_restored_pitr_target" "text", "p_restored_branch_id" "text", "p_duration_minutes" integer, "p_invariants_checked" "text"[], "p_invariants_failed" "text"[], "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_restore_test_run"("p_performed_by" "text", "p_outcome" "text", "p_rpo_target_minutes" integer, "p_rto_target_minutes" integer, "p_restored_pitr_target" "text", "p_restored_branch_id" "text", "p_duration_minutes" integer, "p_invariants_checked" "text"[], "p_invariants_failed" "text"[], "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_secret_rotation"("p_secret_name" "text", "p_reason" "text", "p_rotated_by" "text", "p_previous_fingerprint" "text", "p_new_fingerprint" "text", "p_notes" "text", "p_ticket_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_secret_rotation"("p_secret_name" "text", "p_reason" "text", "p_rotated_by" "text", "p_previous_fingerprint" "text", "p_new_fingerprint" "text", "p_notes" "text", "p_ticket_url" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rpc_bootstrap_user"("p_user_id" "uuid", "p_user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rpc_bootstrap_user"("p_user_id" "uuid", "p_user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_uuid"("t" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_uuid"("t" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_uuid"("t" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_embeddings"("p_org_id" "uuid", "p_query_embedding" "extensions"."vector", "p_source_types" "text"[], "p_limit" integer, "p_similarity_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."search_embeddings"("p_org_id" "uuid", "p_query_embedding" "extensions"."vector", "p_source_types" "text"[], "p_limit" integer, "p_similarity_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_embeddings"("p_org_id" "uuid", "p_query_embedding" "extensions"."vector", "p_source_types" "text"[], "p_limit" integer, "p_similarity_threshold" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_entities"("p_org_id" "uuid", "p_query" "text", "p_entity_types" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_entities"("p_org_id" "uuid", "p_query" "text", "p_entity_types" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_entities"("p_org_id" "uuid", "p_query" "text", "p_entity_types" "text"[], "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_mfa_required_on_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_mfa_required_on_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_mfa_required_on_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."snapshot_dormant_users"("p_threshold_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."snapshot_dormant_users"("p_threshold_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_evidence_freshness"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_evidence_freshness"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_evidence_freshness"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_org_forms_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_org_forms_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_org_forms_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_security_alerts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_security_alerts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_security_alerts_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_session_heartbeat"("p_session_id" "text", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_session_heartbeat"("p_session_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_heartbeat"("p_session_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trust_packets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trust_packets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trust_packets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_workflow_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_workflow_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_workflow_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" TO "anon";
GRANT ALL ON TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" TO "authenticated";
GRANT ALL ON TABLE "public"."__pre_orgs_sync_2026_05_25_orgs_only" TO "service_role";



GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_jobs" TO "anon";
GRANT ALL ON TABLE "public"."admin_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notes" TO "anon";
GRANT ALL ON TABLE "public"."admin_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notes" TO "service_role";



GRANT ALL ON TABLE "public"."ai_document_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."ai_document_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_document_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_index_status" TO "anon";
GRANT ALL ON TABLE "public"."ai_index_status" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_index_status" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_log" TO "service_role";



GRANT ALL ON TABLE "public"."api_alert_config" TO "anon";
GRANT ALL ON TABLE "public"."api_alert_config" TO "authenticated";
GRANT ALL ON TABLE "public"."api_alert_config" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."api_health" TO "anon";
GRANT ALL ON TABLE "public"."api_health" TO "authenticated";
GRANT ALL ON TABLE "public"."api_health" TO "service_role";



GRANT ALL ON TABLE "public"."api_key_usage_log" TO "anon";
GRANT ALL ON TABLE "public"."api_key_usage_log" TO "authenticated";
GRANT ALL ON TABLE "public"."api_key_usage_log" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."app_modules" TO "anon";
GRANT ALL ON TABLE "public"."app_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."app_modules" TO "service_role";



GRANT ALL ON TABLE "public"."org_credentials" TO "anon";
GRANT ALL ON TABLE "public"."org_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."org_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles_public" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles_public" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles_public" TO "service_role";



GRANT ALL ON TABLE "public"."at_risk_credentials" TO "anon";
GRANT ALL ON TABLE "public"."at_risk_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."at_risk_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."audit_chain_anchors" TO "anon";
GRANT ALL ON TABLE "public"."audit_chain_anchors" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_chain_anchors" TO "service_role";



GRANT ALL ON TABLE "public"."audit_chain_secrets" TO "anon";
GRANT ALL ON TABLE "public"."audit_chain_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_chain_secrets" TO "service_role";



GRANT ALL ON TABLE "public"."audit_export_jobs" TO "anon";
GRANT ALL ON TABLE "public"."audit_export_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_export_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."audit_retention_config" TO "anon";
GRANT ALL ON TABLE "public"."audit_retention_config" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_retention_config" TO "service_role";



GRANT ALL ON TABLE "public"."auditor_access_tokens" TO "anon";
GRANT ALL ON TABLE "public"."auditor_access_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."auditor_access_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."auditor_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."auditor_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."auditor_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."billing_events" TO "anon";
GRANT ALL ON TABLE "public"."billing_events" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_events" TO "service_role";



GRANT ALL ON TABLE "public"."billing_events_audit" TO "anon";
GRANT ALL ON TABLE "public"."billing_events_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_events_audit" TO "service_role";



GRANT ALL ON TABLE "public"."billing_plans" TO "anon";
GRANT ALL ON TABLE "public"."billing_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_plans" TO "service_role";



GRANT ALL ON TABLE "public"."billing_reconciliation_log" TO "anon";
GRANT ALL ON TABLE "public"."billing_reconciliation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_reconciliation_log" TO "service_role";



GRANT ALL ON TABLE "public"."care_industries" TO "anon";
GRANT ALL ON TABLE "public"."care_industries" TO "authenticated";
GRANT ALL ON TABLE "public"."care_industries" TO "service_role";



GRANT ALL ON TABLE "public"."care_policy_templates" TO "anon";
GRANT ALL ON TABLE "public"."care_policy_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."care_policy_templates" TO "service_role";



GRANT ALL ON TABLE "public"."care_register_templates" TO "anon";
GRANT ALL ON TABLE "public"."care_register_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."care_register_templates" TO "service_role";



GRANT ALL ON TABLE "public"."care_service_types" TO "anon";
GRANT ALL ON TABLE "public"."care_service_types" TO "authenticated";
GRANT ALL ON TABLE "public"."care_service_types" TO "service_role";



GRANT ALL ON TABLE "public"."care_task_templates" TO "anon";
GRANT ALL ON TABLE "public"."care_task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."care_task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_controls" TO "anon";
GRANT ALL ON TABLE "public"."compliance_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_controls" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_frameworks" TO "anon";
GRANT ALL ON TABLE "public"."compliance_frameworks" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_frameworks" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_playbook_controls" TO "anon";
GRANT ALL ON TABLE "public"."compliance_playbook_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_playbook_controls" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_playbooks" TO "anon";
GRANT ALL ON TABLE "public"."compliance_playbooks" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_playbooks" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_scans" TO "anon";
GRANT ALL ON TABLE "public"."compliance_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_scans" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_score_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."scan_findings" TO "anon";
GRANT ALL ON TABLE "public"."scan_findings" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_findings" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_status" TO "anon";
GRANT ALL ON TABLE "public"."compliance_status" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_status" TO "service_role";



GRANT ALL ON TABLE "public"."control_evidence" TO "anon";
GRANT ALL ON TABLE "public"."control_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."control_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."control_group_members" TO "anon";
GRANT ALL ON TABLE "public"."control_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."control_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."control_groups" TO "anon";
GRANT ALL ON TABLE "public"."control_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."control_groups" TO "service_role";



GRANT ALL ON TABLE "public"."control_mappings" TO "anon";
GRANT ALL ON TABLE "public"."control_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."control_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."control_tasks" TO "anon";
GRANT ALL ON TABLE "public"."control_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."control_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."custom_roles" TO "anon";
GRANT ALL ON TABLE "public"."custom_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_roles" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_layouts" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widget_registry" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widget_registry" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widget_registry" TO "service_role";



GRANT ALL ON TABLE "public"."document_lifecycle_log" TO "anon";
GRANT ALL ON TABLE "public"."document_lifecycle_log" TO "authenticated";
GRANT ALL ON TABLE "public"."document_lifecycle_log" TO "service_role";



GRANT ALL ON TABLE "public"."org_members" TO "anon";
GRANT ALL ON TABLE "public"."org_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_members" TO "service_role";



GRANT ALL ON TABLE "public"."user_purge_jobs" TO "anon";
GRANT ALL ON TABLE "public"."user_purge_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_purge_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."dormant_user_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."dormant_user_purge_holds" TO "anon";
GRANT ALL ON TABLE "public"."dormant_user_purge_holds" TO "authenticated";
GRANT ALL ON TABLE "public"."dormant_user_purge_holds" TO "service_role";



GRANT ALL ON TABLE "public"."dormant_user_reviews" TO "anon";
GRANT ALL ON TABLE "public"."dormant_user_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."dormant_user_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."email_logs" TO "anon";
GRANT ALL ON TABLE "public"."email_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_logs" TO "service_role";



GRANT ALL ON TABLE "public"."email_preferences" TO "anon";
GRANT ALL ON TABLE "public"."email_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."email_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."file_metadata" TO "anon";
GRANT ALL ON TABLE "public"."file_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."file_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."file_versions" TO "anon";
GRANT ALL ON TABLE "public"."file_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."file_versions" TO "service_role";



GRANT ALL ON TABLE "public"."form_responses" TO "anon";
GRANT ALL ON TABLE "public"."form_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."form_responses" TO "service_role";



GRANT ALL ON TABLE "public"."forms" TO "anon";
GRANT ALL ON TABLE "public"."forms" TO "authenticated";
GRANT ALL ON TABLE "public"."forms" TO "service_role";



GRANT ALL ON TABLE "public"."form_analytics" TO "anon";
GRANT ALL ON TABLE "public"."form_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."form_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."framework_control_mappings" TO "anon";
GRANT ALL ON TABLE "public"."framework_control_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."framework_control_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."framework_controls" TO "anon";
GRANT ALL ON TABLE "public"."framework_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."framework_controls" TO "service_role";



GRANT ALL ON TABLE "public"."framework_domains" TO "anon";
GRANT ALL ON TABLE "public"."framework_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."framework_domains" TO "service_role";



GRANT ALL ON TABLE "public"."frameworks" TO "anon";
GRANT ALL ON TABLE "public"."frameworks" TO "authenticated";
GRANT ALL ON TABLE "public"."frameworks" TO "service_role";



GRANT ALL ON TABLE "public"."graph_nodes" TO "anon";
GRANT ALL ON TABLE "public"."graph_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."graph_nodes" TO "service_role";



GRANT ALL ON TABLE "public"."graph_wires" TO "anon";
GRANT ALL ON TABLE "public"."graph_wires" TO "authenticated";
GRANT ALL ON TABLE "public"."graph_wires" TO "service_role";



GRANT ALL ON TABLE "public"."integration_configs" TO "anon";
GRANT ALL ON TABLE "public"."integration_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_configs" TO "service_role";



GRANT ALL ON TABLE "public"."integration_event_mappings" TO "anon";
GRANT ALL ON TABLE "public"."integration_event_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_event_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."integration_events" TO "anon";
GRANT ALL ON TABLE "public"."integration_events" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_events" TO "service_role";



GRANT ALL ON TABLE "public"."integration_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."integration_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."integration_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."legal_hold_documents" TO "anon";
GRANT ALL ON TABLE "public"."legal_hold_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_hold_documents" TO "service_role";



GRANT ALL ON TABLE "public"."legal_holds" TO "anon";
GRANT ALL ON TABLE "public"."legal_holds" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_holds" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_config" TO "anon";
GRANT ALL ON TABLE "public"."marketing_config" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_config" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_leads" TO "anon";
GRANT ALL ON TABLE "public"."marketing_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_leads" TO "service_role";



GRANT ALL ON TABLE "public"."master_controls" TO "anon";
GRANT ALL ON TABLE "public"."master_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."master_controls" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."org_analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."org_analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."org_analytics_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."org_assets" TO "anon";
GRANT ALL ON TABLE "public"."org_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."org_assets" TO "service_role";



GRANT ALL ON TABLE "public"."org_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."org_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."org_audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."org_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."org_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."org_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."org_behaviour_support_plans" TO "anon";
GRANT ALL ON TABLE "public"."org_behaviour_support_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."org_behaviour_support_plans" TO "service_role";



GRANT ALL ON TABLE "public"."org_branding" TO "anon";
GRANT ALL ON TABLE "public"."org_branding" TO "authenticated";
GRANT ALL ON TABLE "public"."org_branding" TO "service_role";



GRANT ALL ON TABLE "public"."org_capa_events" TO "anon";
GRANT ALL ON TABLE "public"."org_capa_events" TO "authenticated";
GRANT ALL ON TABLE "public"."org_capa_events" TO "service_role";



GRANT ALL ON TABLE "public"."org_capa_items" TO "anon";
GRANT ALL ON TABLE "public"."org_capa_items" TO "authenticated";
GRANT ALL ON TABLE "public"."org_capa_items" TO "service_role";



GRANT ALL ON TABLE "public"."org_care_goals" TO "anon";
GRANT ALL ON TABLE "public"."org_care_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."org_care_goals" TO "service_role";



GRANT ALL ON TABLE "public"."org_care_plan_versions" TO "anon";
GRANT ALL ON TABLE "public"."org_care_plan_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_care_plan_versions" TO "service_role";



GRANT ALL ON TABLE "public"."org_care_plans" TO "anon";
GRANT ALL ON TABLE "public"."org_care_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."org_care_plans" TO "service_role";



GRANT ALL ON TABLE "public"."org_certifications" TO "anon";
GRANT ALL ON TABLE "public"."org_certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."org_certifications" TO "service_role";



GRANT ALL ON TABLE "public"."org_compliance_blocks" TO "anon";
GRANT ALL ON TABLE "public"."org_compliance_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."org_compliance_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."org_compliance_health_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."org_compliance_health_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."org_compliance_health_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."org_compliance_status" TO "anon";
GRANT ALL ON TABLE "public"."org_compliance_status" TO "authenticated";
GRANT ALL ON TABLE "public"."org_compliance_status" TO "service_role";



GRANT ALL ON TABLE "public"."org_control_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."org_control_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_control_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."org_control_mappings" TO "anon";
GRANT ALL ON TABLE "public"."org_control_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."org_control_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."org_controls" TO "anon";
GRANT ALL ON TABLE "public"."org_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."org_controls" TO "service_role";



GRANT ALL ON TABLE "public"."org_entities" TO "anon";
GRANT ALL ON TABLE "public"."org_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."org_entities" TO "service_role";



GRANT ALL ON TABLE "public"."org_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."org_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."org_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."org_entity_members" TO "anon";
GRANT ALL ON TABLE "public"."org_entity_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_entity_members" TO "service_role";



GRANT ALL ON TABLE "public"."org_evidence" TO "anon";
GRANT ALL ON TABLE "public"."org_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."org_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."org_exports" TO "anon";
GRANT ALL ON TABLE "public"."org_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."org_exports" TO "service_role";



GRANT ALL ON TABLE "public"."org_feature_toggles" TO "anon";
GRANT ALL ON TABLE "public"."org_feature_toggles" TO "authenticated";
GRANT ALL ON TABLE "public"."org_feature_toggles" TO "service_role";



GRANT ALL ON TABLE "public"."org_files" TO "anon";
GRANT ALL ON TABLE "public"."org_files" TO "authenticated";
GRANT ALL ON TABLE "public"."org_files" TO "service_role";



GRANT ALL ON TABLE "public"."org_first_session_progress" TO "anon";
GRANT ALL ON TABLE "public"."org_first_session_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."org_first_session_progress" TO "service_role";



GRANT ALL ON TABLE "public"."org_form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."org_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."org_form_templates" TO "anon";
GRANT ALL ON TABLE "public"."org_form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."org_form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."org_forms" TO "anon";
GRANT ALL ON TABLE "public"."org_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."org_forms" TO "service_role";



GRANT ALL ON TABLE "public"."org_frameworks" TO "anon";
GRANT ALL ON TABLE "public"."org_frameworks" TO "authenticated";
GRANT ALL ON TABLE "public"."org_frameworks" TO "service_role";



GRANT ALL ON TABLE "public"."org_goal_progress_entries" TO "anon";
GRANT ALL ON TABLE "public"."org_goal_progress_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."org_goal_progress_entries" TO "service_role";



GRANT ALL ON TABLE "public"."org_group_members" TO "anon";
GRANT ALL ON TABLE "public"."org_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."org_groups" TO "anon";
GRANT ALL ON TABLE "public"."org_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."org_groups" TO "service_role";



GRANT ALL ON TABLE "public"."org_incidents" TO "anon";
GRANT ALL ON TABLE "public"."org_incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."org_incidents" TO "service_role";



GRANT ALL ON TABLE "public"."org_industries" TO "anon";
GRANT ALL ON TABLE "public"."org_industries" TO "authenticated";
GRANT ALL ON TABLE "public"."org_industries" TO "service_role";



GRANT ALL ON TABLE "public"."org_integrations" TO "anon";
GRANT ALL ON TABLE "public"."org_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."org_investigations" TO "anon";
GRANT ALL ON TABLE "public"."org_investigations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_investigations" TO "service_role";



GRANT ALL ON TABLE "public"."org_invites" TO "anon";
GRANT ALL ON TABLE "public"."org_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invites" TO "service_role";



GRANT ALL ON TABLE "public"."org_medication_administrations" TO "anon";
GRANT ALL ON TABLE "public"."org_medication_administrations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_medication_administrations" TO "service_role";



GRANT ALL ON TABLE "public"."org_medications" TO "anon";
GRANT ALL ON TABLE "public"."org_medications" TO "authenticated";
GRANT ALL ON TABLE "public"."org_medications" TO "service_role";



GRANT ALL ON TABLE "public"."org_memberships" TO "anon";
GRANT ALL ON TABLE "public"."org_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."org_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."org_module_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."org_module_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."org_module_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."org_ndis_line_items" TO "anon";
GRANT ALL ON TABLE "public"."org_ndis_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."org_ndis_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."org_ndis_price_guide" TO "anon";
GRANT ALL ON TABLE "public"."org_ndis_price_guide" TO "authenticated";
GRANT ALL ON TABLE "public"."org_ndis_price_guide" TO "service_role";



GRANT ALL ON TABLE "public"."org_notification_prefs" TO "anon";
GRANT ALL ON TABLE "public"."org_notification_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."org_notification_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."org_notifications" TO "anon";
GRANT ALL ON TABLE "public"."org_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."org_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."org_onboarding_status" TO "anon";
GRANT ALL ON TABLE "public"."org_onboarding_status" TO "authenticated";
GRANT ALL ON TABLE "public"."org_onboarding_status" TO "service_role";



GRANT ALL ON TABLE "public"."org_patient_assignments" TO "anon";
GRANT ALL ON TABLE "public"."org_patient_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."org_patient_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."org_patients" TO "anon";
GRANT ALL ON TABLE "public"."org_patients" TO "authenticated";
GRANT ALL ON TABLE "public"."org_patients" TO "service_role";



GRANT ALL ON TABLE "public"."org_policies" TO "anon";
GRANT ALL ON TABLE "public"."org_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."org_policies" TO "service_role";



GRANT ALL ON TABLE "public"."org_progress_notes" TO "anon";
GRANT ALL ON TABLE "public"."org_progress_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."org_progress_notes" TO "service_role";



GRANT ALL ON TABLE "public"."org_registers" TO "anon";
GRANT ALL ON TABLE "public"."org_registers" TO "authenticated";
GRANT ALL ON TABLE "public"."org_registers" TO "service_role";



GRANT ALL ON TABLE "public"."org_regulatory_notifications" TO "anon";
GRANT ALL ON TABLE "public"."org_regulatory_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."org_regulatory_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."org_report_generations" TO "anon";
GRANT ALL ON TABLE "public"."org_report_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."org_report_generations" TO "service_role";



GRANT ALL ON TABLE "public"."org_risks" TO "anon";
GRANT ALL ON TABLE "public"."org_risks" TO "authenticated";
GRANT ALL ON TABLE "public"."org_risks" TO "service_role";



GRANT ALL ON TABLE "public"."org_saved_reports" TO "anon";
GRANT ALL ON TABLE "public"."org_saved_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."org_saved_reports" TO "service_role";



GRANT ALL ON TABLE "public"."org_settings" TO "anon";
GRANT ALL ON TABLE "public"."org_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."org_settings" TO "service_role";



GRANT ALL ON TABLE "public"."org_shifts" TO "anon";
GRANT ALL ON TABLE "public"."org_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."org_shifts" TO "service_role";



GRANT ALL ON TABLE "public"."org_staff_credentials" TO "anon";
GRANT ALL ON TABLE "public"."org_staff_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."org_staff_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."org_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."org_tasks" TO "anon";
GRANT ALL ON TABLE "public"."org_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."org_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."org_usage_events" TO "anon";
GRANT ALL ON TABLE "public"."org_usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."org_usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."org_usage_summaries" TO "anon";
GRANT ALL ON TABLE "public"."org_usage_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."org_usage_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."org_visits" TO "anon";
GRANT ALL ON TABLE "public"."org_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."org_visits" TO "service_role";



GRANT ALL ON TABLE "public"."org_workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."org_workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."org_workflow_executions" TO "service_role";



GRANT ALL ON TABLE "public"."org_workflows" TO "anon";
GRANT ALL ON TABLE "public"."org_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."org_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."password_history" TO "anon";
GRANT ALL ON TABLE "public"."password_history" TO "authenticated";
GRANT ALL ON TABLE "public"."password_history" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."platform_security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."platform_security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";



GRANT ALL ON TABLE "public"."policy_acknowledgments" TO "anon";
GRANT ALL ON TABLE "public"."policy_acknowledgments" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_acknowledgments" TO "service_role";



GRANT ALL ON TABLE "public"."policy_approvals" TO "anon";
GRANT ALL ON TABLE "public"."policy_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."policy_review_schedules" TO "anon";
GRANT ALL ON TABLE "public"."policy_review_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_review_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."policy_versions" TO "anon";
GRANT ALL ON TABLE "public"."policy_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_versions" TO "service_role";



GRANT ALL ON TABLE "public"."product_releases" TO "anon";
GRANT ALL ON TABLE "public"."product_releases" TO "authenticated";
GRANT ALL ON TABLE "public"."product_releases" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purged_subject_redactions" TO "anon";
GRANT ALL ON TABLE "public"."purged_subject_redactions" TO "authenticated";
GRANT ALL ON TABLE "public"."purged_subject_redactions" TO "service_role";



GRANT ALL ON TABLE "public"."push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_log" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_log" TO "service_role";



GRANT ALL ON TABLE "public"."rbac_permissions" TO "anon";
GRANT ALL ON TABLE "public"."rbac_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."rbac_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."rbac_role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."rbac_role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."rbac_role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."rbac_roles" TO "anon";
GRANT ALL ON TABLE "public"."rbac_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."rbac_roles" TO "service_role";



GRANT ALL ON TABLE "public"."recent_items" TO "anon";
GRANT ALL ON TABLE "public"."recent_items" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_items" TO "service_role";



GRANT ALL ON TABLE "public"."registers" TO "anon";
GRANT ALL ON TABLE "public"."registers" TO "authenticated";
GRANT ALL ON TABLE "public"."registers" TO "service_role";



GRANT ALL ON TABLE "public"."report_generations" TO "anon";
GRANT ALL ON TABLE "public"."report_generations" TO "authenticated";
GRANT ALL ON TABLE "public"."report_generations" TO "service_role";



GRANT ALL ON TABLE "public"."report_templates" TO "anon";
GRANT ALL ON TABLE "public"."report_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."report_templates" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."restore_test_runs" TO "anon";
GRANT ALL ON TABLE "public"."restore_test_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."restore_test_runs" TO "service_role";



GRANT ALL ON TABLE "public"."retention_policies" TO "anon";
GRANT ALL ON TABLE "public"."retention_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."retention_policies" TO "service_role";



GRANT ALL ON TABLE "public"."risk_analyses" TO "anon";
GRANT ALL ON TABLE "public"."risk_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."risk_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."risk_summary" TO "anon";
GRANT ALL ON TABLE "public"."risk_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."risk_summary" TO "service_role";



GRANT ALL ON TABLE "public"."saved_searches" TO "anon";
GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_searches" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_tasks" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."search_history" TO "anon";
GRANT ALL ON TABLE "public"."search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."search_history" TO "service_role";



GRANT ALL ON TABLE "public"."search_index" TO "anon";
GRANT ALL ON TABLE "public"."search_index" TO "authenticated";
GRANT ALL ON TABLE "public"."search_index" TO "service_role";



GRANT ALL ON TABLE "public"."secret_rotations" TO "anon";
GRANT ALL ON TABLE "public"."secret_rotations" TO "authenticated";
GRANT ALL ON TABLE "public"."secret_rotations" TO "service_role";



GRANT ALL ON TABLE "public"."security_alerts" TO "anon";
GRANT ALL ON TABLE "public"."security_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."security_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_requests" TO "anon";
GRANT ALL ON TABLE "public"."support_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."support_requests" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_dependencies" TO "anon";
GRANT ALL ON TABLE "public"."task_dependencies" TO "authenticated";
GRANT ALL ON TABLE "public"."task_dependencies" TO "service_role";



GRANT ALL ON TABLE "public"."task_recurrence" TO "anon";
GRANT ALL ON TABLE "public"."task_recurrence" TO "authenticated";
GRANT ALL ON TABLE "public"."task_recurrence" TO "service_role";



GRANT ALL ON TABLE "public"."task_time_entries" TO "anon";
GRANT ALL ON TABLE "public"."task_time_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."task_time_entries" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_groups" TO "anon";
GRANT ALL ON TABLE "public"."team_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."team_groups" TO "service_role";



GRANT ALL ON TABLE "public"."team_invitations" TO "anon";
GRANT ALL ON TABLE "public"."team_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."team_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."trust_packets" TO "anon";
GRANT ALL ON TABLE "public"."trust_packets" TO "authenticated";
GRANT ALL ON TABLE "public"."trust_packets" TO "service_role";



GRANT ALL ON TABLE "public"."unified_org_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."unified_org_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_org_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_security" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_security" TO "authenticated";
GRANT ALL ON TABLE "public"."user_security" TO "service_role";



GRANT ALL ON TABLE "public"."user_session_revocations" TO "anon";
GRANT ALL ON TABLE "public"."user_session_revocations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_session_revocations" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_configs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_configs" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."webhook_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_deliveries" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







