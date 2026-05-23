-- v4-012: three SQL-layer security holes patched in one migration.
--
-- 1. search_embeddings (RPC) was SECURITY DEFINER with no search_path
--    and no membership check. Any authenticated user could read any
--    org's embeddings by passing the target org_id.
-- 2. public.tasks / public.policies / public.registers had NULLable
--    organization_id. RLS `IN (SELECT ...)` predicates silently
--    allowed NULL rows to slip past read filters while remaining
--    addressable by id for UPDATE/DELETE.
-- 3. ensure_founder_role trigger + function pinned a literal Gmail
--    address into the production schema, auto-promoting it to owner
--    in every org-membership row on INSERT/UPDATE to auth.users —
--    an undocumented privileged backdoor an auditor would reject.

-- ------------------------------------------------------------------
-- 1. Lock down search_embeddings.
-- ------------------------------------------------------------------
-- Recreate with: explicit search_path (prevents schema-shadowing
-- attacks), an auth.uid() membership check at the top, and a public
-- revoke. Keep SECURITY DEFINER because the HNSW index lookup
-- benefits from bypassing per-row RLS evaluation on the embeddings
-- table; the explicit membership gate restores tenant isolation.
DROP FUNCTION IF EXISTS public.search_embeddings(
  uuid, vector, text[], integer, double precision
);

CREATE OR REPLACE FUNCTION public.search_embeddings(
  p_org_id UUID,
  p_query_embedding vector(1536),
  p_source_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Tenant guard. service_role bypasses (it has no auth.uid()).
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.org_members
       WHERE organization_id = p_org_id
         AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'search_embeddings: caller is not a member of org %', p_org_id
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.source_type,
    e.source_id,
    e.chunk_index,
    e.chunk_text,
    e.metadata,
    1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM public.ai_document_embeddings e
  WHERE e.org_id = p_org_id
    AND (p_source_types IS NULL OR e.source_type = ANY(p_source_types))
    AND 1 - (e.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_embeddings(
  uuid, vector, text[], integer, double precision
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_embeddings(
  uuid, vector, text[], integer, double precision
) TO authenticated, service_role;

-- ------------------------------------------------------------------
-- 2. NOT NULL organization_id on baseline tasks / policies /
--    registers. Existing NULL rows are unaddressable by RLS and
--    cannot belong to any tenant — delete them, counting first so
--    the apply log shows the blast radius.
-- ------------------------------------------------------------------
DO $$
DECLARE
  v_tasks_deleted     bigint := 0;
  v_policies_deleted  bigint := 0;
  v_registers_deleted bigint := 0;
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    WITH d AS (
      DELETE FROM public.tasks WHERE organization_id IS NULL RETURNING 1
    )
    SELECT count(*) INTO v_tasks_deleted FROM d;
    EXECUTE 'ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL';
    RAISE NOTICE 'v4-012: tasks — deleted % orphan rows, organization_id NOT NULL', v_tasks_deleted;
  END IF;

  IF to_regclass('public.policies') IS NOT NULL THEN
    WITH d AS (
      DELETE FROM public.policies WHERE organization_id IS NULL RETURNING 1
    )
    SELECT count(*) INTO v_policies_deleted FROM d;
    EXECUTE 'ALTER TABLE public.policies ALTER COLUMN organization_id SET NOT NULL';
    RAISE NOTICE 'v4-012: policies — deleted % orphan rows, organization_id NOT NULL', v_policies_deleted;
  END IF;

  IF to_regclass('public.registers') IS NOT NULL THEN
    WITH d AS (
      DELETE FROM public.registers WHERE organization_id IS NULL RETURNING 1
    )
    SELECT count(*) INTO v_registers_deleted FROM d;
    EXECUTE 'ALTER TABLE public.registers ALTER COLUMN organization_id SET NOT NULL';
    RAISE NOTICE 'v4-012: registers — deleted % orphan rows, organization_id NOT NULL', v_registers_deleted;
  END IF;
END $$;

-- ------------------------------------------------------------------
-- 3. Drop the hardcoded-email founder trigger and its function.
--    The one-shot data fix in 20260114000 (role/plan/subscription)
--    is retained in history; only the persistent auto-promotion
--    trigger goes away. Any future founder/role provisioning must
--    happen via an explicit admin action with a corresponding audit
--    log entry.
-- ------------------------------------------------------------------
DROP TRIGGER IF EXISTS ensure_founder_role_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_founder_role();
