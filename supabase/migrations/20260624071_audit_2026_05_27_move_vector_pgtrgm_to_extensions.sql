-- Audit 2026-05-27 (Tier 3.1) — move vector + pg_trgm out of public schema.
--
-- Closes two long-standing Supabase advisor WARNs:
--   * extension_in_public for vector
--   * extension_in_public for pg_trgm
--
-- Pre-flight audit (audit 2026-05-27):
--   * Only 1 user column uses public.vector — ai_document_embeddings.embedding.
--     OID-tracked, so the column reference keeps working after the move.
--   * 2 user indexes use vector_cosine_ops + gin_trgm_ops operator classes —
--     OID-tracked, both keep working.
--   * Zero user functions hardcode public.vector / public.<operator>
--     (the only matches in pg_proc are the extensions' own internal
--     functions, which move with the extension itself).
--   * Database-level search_path is "$user", public, extensions — so
--     operator + type lookups resolve correctly after the move.
--   * ONE function-scoped search_path needs widening: search_embeddings
--     sets search_path TO 'public', 'pg_temp', which would lose the
--     <=> operator after the move. Fixed below.
--
-- Order matters:
--   1. Widen search_embeddings's search_path so the move doesn't break it.
--   2. Move pg_trgm + vector to extensions.
--
-- Rollback (if a regression surfaces post-merge):
--   ALTER EXTENSION vector   SET SCHEMA public;
--   ALTER EXTENSION pg_trgm  SET SCHEMA public;
--   ALTER FUNCTION public.search_embeddings(uuid, vector, text[], integer, double precision)
--     SET search_path TO 'public', 'pg_temp';

-- 1. Widen the search_embeddings function-scoped search_path. The
--    function calls the `<=>` operator from pgvector; after the move
--    that operator lives in extensions schema and won't resolve via
--    just 'public'.
ALTER FUNCTION public.search_embeddings(
  uuid, public.vector, text[], integer, double precision
) SET search_path TO 'public', 'extensions', 'pg_temp';

-- 2. Move pg_trgm out of public. Existing gin_trgm_ops indexes keep
--    working because the operator-class reference is OID-based.
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. Move pgvector out of public. Existing vector columns + hnsw
--    indexes keep working because all references are OID-based; only
--    name-based code paths (DDL using `vector_cosine_ops` etc. without
--    a qualifier) need search_path to include `extensions`, which it
--    does at the database level + the function level (step 1).
ALTER EXTENSION vector SET SCHEMA extensions;
