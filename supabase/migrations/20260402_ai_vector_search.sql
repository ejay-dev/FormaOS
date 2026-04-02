-- =========================================================
-- AI Vector Search Infrastructure
-- Prompt 7: RAG Intelligence
-- =========================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- Document Embeddings Table
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('evidence', 'policy', 'control', 'task', 'form_submission', 'care_plan', 'incident')),
  source_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_hnsw ON ai_document_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_org ON ai_document_embeddings(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_source ON ai_document_embeddings(source_type, source_id);

-- RLS
ALTER TABLE ai_document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_embeddings_org_isolation" ON ai_document_embeddings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- =========================================================
-- AI Usage Log
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  conversation_id UUID,
  feature TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage_log(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(org_id, user_id, created_at);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_org_isolation" ON ai_usage_log
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- =========================================================
-- AI Document Index Status (tracks what's been indexed)
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_index_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  indexed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'indexed' CHECK (status IN ('indexed', 'pending', 'failed', 'stale')),
  error_message TEXT,
  UNIQUE (org_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_index_status_org ON ai_index_status(org_id, source_type);

ALTER TABLE ai_index_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_index_status_org_isolation" ON ai_index_status
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- =========================================================
-- Similarity search function
-- =========================================================
CREATE OR REPLACE FUNCTION search_embeddings(
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
