/**
 * AI Vector Store - Index, search, and manage document embeddings
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  generateEmbedding,
  generateEmbeddings,
  chunkDocument,
  TextChunk,
} from './embeddings';

// ---- Types ----

export type SourceType =
  | 'evidence'
  | 'policy'
  | 'control'
  | 'task'
  | 'form_submission'
  | 'care_plan'
  | 'incident';

interface IndexOptions {
  metadata?: Record<string, unknown>;
}

interface SearchOptions {
  sourceTypes?: SourceType[];
  limit?: number;
  similarityThreshold?: number;
}

export interface SearchResult {
  id: string;
  sourceType: string;
  sourceId: string;
  chunkIndex: number;
  chunkText: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// ---- Indexing ----

/**
 * Index a document by chunking, embedding, and storing all chunks.
 */
export async function indexDocument(
  db: SupabaseClient,
  orgId: string,
  sourceType: SourceType,
  sourceId: string,
  text: string,
  options: IndexOptions = {},
): Promise<number> {
  if (!text || text.trim().length === 0) return 0;

  // Remove existing chunks for this document
  await db
    .from('ai_document_embeddings')
    .delete()
    .eq('org_id', orgId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);

  // Chunk the document
  const chunks = chunkDocument(text);
  if (chunks.length === 0) return 0;

  // Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(chunks.map((c) => c.text));

  // Store chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    org_id: orgId,
    source_type: sourceType,
    source_id: sourceId,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    embedding: JSON.stringify(embeddings[i]),
    metadata: {
      ...options.metadata,
      chunk_length: chunk.text.length,
    },
  }));

  // Insert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await db.from('ai_document_embeddings').insert(batch);
    if (error) throw error;
  }

  // Update index status
  await db.from('ai_index_status').upsert(
    {
      org_id: orgId,
      source_type: sourceType,
      source_id: sourceId,
      chunk_count: chunks.length,
      indexed_at: new Date().toISOString(),
      status: 'indexed',
    },
    { onConflict: 'org_id,source_type,source_id' },
  );

  return chunks.length;
}

/**
 * Delete all embeddings for a specific document.
 */
export async function deleteDocumentIndex(
  db: SupabaseClient,
  orgId: string,
  sourceType: SourceType,
  sourceId: string,
): Promise<void> {
  await db
    .from('ai_document_embeddings')
    .delete()
    .eq('org_id', orgId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);

  await db
    .from('ai_index_status')
    .delete()
    .eq('org_id', orgId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);
}

/**
 * Reindex a document (delete old, create new).
 */
export async function reindexDocument(
  db: SupabaseClient,
  orgId: string,
  sourceType: SourceType,
  sourceId: string,
  text: string,
  options: IndexOptions = {},
): Promise<number> {
  return indexDocument(db, orgId, sourceType, sourceId, text, options);
}

// ---- Search ----

/**
 * Semantic similarity search across indexed documents.
 */
export async function similaritySearch(
  db: SupabaseClient,
  orgId: string,
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const limit = options.limit ?? 10;
  const threshold = options.similarityThreshold ?? 0.7;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Use the RPC function for vector search
  const { data, error } = await db.rpc('search_embeddings', {
    p_org_id: orgId,
    p_query_embedding: JSON.stringify(queryEmbedding),
    p_source_types: options.sourceTypes ?? null,
    p_limit: limit,
    p_similarity_threshold: threshold,
  });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    chunkIndex: row.chunk_index,
    chunkText: row.chunk_text,
    metadata: row.metadata ?? {},
    similarity: row.similarity,
  }));
}

/**
 * Hybrid search combining vector similarity with keyword matching.
 */
export async function hybridSearch(
  db: SupabaseClient,
  orgId: string,
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const limit = options.limit ?? 10;

  // Run vector search
  const vectorResults = await similaritySearch(db, orgId, query, {
    ...options,
    limit: limit * 2,
    similarityThreshold: 0.6,
  });

  // Run keyword search
  const { data: keywordResults } = await db
    .from('ai_document_embeddings')
    .select('id, source_type, source_id, chunk_index, chunk_text, metadata')
    .eq('org_id', orgId)
    .textSearch('chunk_text', query.split(' ').join(' & '), {
      type: 'plain',
    })
    .limit(limit);

  // Merge and deduplicate results, prefer vector results for ranking
  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  for (const result of vectorResults) {
    if (!seen.has(result.id)) {
      seen.add(result.id);
      merged.push(result);
    }
  }

  for (const row of keywordResults ?? []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push({
        id: row.id,
        sourceType: row.source_type,
        sourceId: row.source_id,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        metadata: row.metadata ?? {},
        similarity: 0.5, // keyword match gets a base score
      });
    }
  }

  return merged.slice(0, limit);
}

// ---- Index Statistics ----

export async function getIndexStats(
  db: SupabaseClient,
  orgId: string,
): Promise<{
  totalChunks: number;
  bySourceType: Record<string, number>;
  lastIndexed: string | null;
}> {
  const { data: statuses } = await db
    .from('ai_index_status')
    .select('source_type, chunk_count, indexed_at')
    .eq('org_id', orgId)
    .eq('status', 'indexed');

  const bySourceType: Record<string, number> = {};
  let totalChunks = 0;
  let lastIndexed: string | null = null;

  for (const row of statuses ?? []) {
    bySourceType[row.source_type] =
      (bySourceType[row.source_type] ?? 0) + (row.chunk_count ?? 0);
    totalChunks += row.chunk_count ?? 0;
    if (!lastIndexed || row.indexed_at > lastIndexed)
      lastIndexed = row.indexed_at;
  }

  return { totalChunks, bySourceType, lastIndexed };
}
