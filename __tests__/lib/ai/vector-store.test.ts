/**
 * Branch-coverage tests for lib/ai/vector-store.ts
 * Targets 46 uncovered branches
 */

jest.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: jest.fn(async () => [0.1, 0.2, 0.3]),
  generateEmbeddings: jest.fn(async (texts: string[]) =>
    texts.map(() => [0.1, 0.2, 0.3]),
  ),
  chunkDocument: jest.fn((text: string) => {
    if (!text.trim()) return [];
    return [{ text: text.slice(0, 100), index: 0 }];
  }),
}));

import {
  indexDocument,
  deleteDocumentIndex,
  reindexDocument,
  similaritySearch,
  hybridSearch,
  getIndexStats,
} from '@/lib/ai/vector-store';

function createMockDb(overrides: Record<string, any> = {}) {
  const builder: Record<string, any> = {};
  [
    'select',
    'insert',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'textSearch',
    'rpc',
  ].forEach((m) => {
    builder[m] = jest.fn(() => builder);
  });
  builder.then = (resolve: any) =>
    resolve({ data: overrides.data ?? null, error: overrides.error ?? null });

  const db: any = {
    from: jest.fn(() => builder),
    rpc: jest.fn(() => ({
      then: (resolve: any) =>
        resolve({
          data: overrides.rpcData ?? [],
          error: overrides.rpcError ?? null,
        }),
    })),
    _builder: builder,
  };
  return db;
}

describe('vector-store branches', () => {
  describe('indexDocument', () => {
    it('returns 0 for empty text', async () => {
      const db = createMockDb();
      const result = await indexDocument(db, 'org1', 'evidence', 'e1', '');
      expect(result).toBe(0);
    });

    it('returns 0 for whitespace-only text', async () => {
      const db = createMockDb();
      const result = await indexDocument(db, 'org1', 'policy', 'p1', '   ');
      expect(result).toBe(0);
    });

    it('indexes a document successfully', async () => {
      const db = createMockDb();
      const result = await indexDocument(
        db,
        'org1',
        'control',
        'c1',
        'Some document content',
      );
      expect(result).toBe(1); // 1 chunk from mocked chunkDocument
      expect(db.from).toHaveBeenCalledWith('ai_document_embeddings');
    });

    it('indexes with metadata option', async () => {
      const db = createMockDb();
      const result = await indexDocument(
        db,
        'org1',
        'task',
        't1',
        'Task document',
        {
          metadata: { framework: 'SOC2' },
        },
      );
      expect(result).toBe(1);
    });

    it('throws on insert error', async () => {
      const db = createMockDb({ error: { message: 'DB error' } });
      await expect(
        indexDocument(db, 'org1', 'incident', 'i1', 'Some content'),
      ).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('deleteDocumentIndex', () => {
    it('deletes embeddings and index status', async () => {
      const db = createMockDb();
      await deleteDocumentIndex(db, 'org1', 'evidence', 'e1');
      expect(db.from).toHaveBeenCalledWith('ai_document_embeddings');
      expect(db.from).toHaveBeenCalledWith('ai_index_status');
    });
  });

  describe('reindexDocument', () => {
    it('delegates to indexDocument', async () => {
      const db = createMockDb();
      const result = await reindexDocument(
        db,
        'org1',
        'policy',
        'p1',
        'New content',
      );
      expect(result).toBe(1);
    });
  });

  describe('similaritySearch', () => {
    it('returns search results', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) =>
            resolve({
              data: [
                {
                  id: 'r1',
                  source_type: 'evidence',
                  source_id: 'e1',
                  chunk_index: 0,
                  chunk_text: 'matching text',
                  metadata: { key: 'value' },
                  similarity: 0.85,
                },
              ],
              error: null,
            }),
        })),
      };
      const results = await similaritySearch(db, 'org1', 'test query');
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBe(0.85);
    });

    it('uses default options', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: [], error: null }),
        })),
      };
      const results = await similaritySearch(db, 'org1', 'query');
      expect(results).toEqual([]);
      expect(db.rpc).toHaveBeenCalledWith(
        'search_embeddings',
        expect.objectContaining({
          p_limit: 10,
          p_similarity_threshold: 0.7,
        }),
      );
    });

    it('uses custom options', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: [], error: null }),
        })),
      };
      await similaritySearch(db, 'org1', 'query', {
        limit: 5,
        similarityThreshold: 0.9,
        sourceTypes: ['evidence', 'policy'],
      });
      expect(db.rpc).toHaveBeenCalledWith(
        'search_embeddings',
        expect.objectContaining({
          p_limit: 5,
          p_similarity_threshold: 0.9,
          p_source_types: ['evidence', 'policy'],
        }),
      );
    });

    it('throws on rpc error', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) =>
            resolve({ data: null, error: { message: 'RPC failed' } }),
        })),
      };
      await expect(similaritySearch(db, 'org1', 'query')).rejects.toEqual({
        message: 'RPC failed',
      });
    });

    it('returns empty array for null data', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: null, error: null }),
        })),
      };
      const results = await similaritySearch(db, 'org1', 'query');
      expect(results).toEqual([]);
    });

    it('handles row with null metadata', async () => {
      const db: any = {
        rpc: jest.fn(() => ({
          then: (resolve: any) =>
            resolve({
              data: [
                {
                  id: 'r1',
                  source_type: 't',
                  source_id: 's',
                  chunk_index: 0,
                  chunk_text: 'x',
                  metadata: null,
                  similarity: 0.8,
                },
              ],
              error: null,
            }),
        })),
      };
      const results = await similaritySearch(db, 'org1', 'query');
      expect(results[0].metadata).toEqual({});
    });
  });

  describe('hybridSearch', () => {
    it('merges vector and keyword results', async () => {
      const vectorResult = {
        id: 'v1',
        source_type: 'evidence',
        source_id: 'e1',
        chunk_index: 0,
        chunk_text: 'vector match',
        metadata: {},
        similarity: 0.8,
      };
      const keywordResult = {
        id: 'k1',
        source_type: 'policy',
        source_id: 'p1',
        chunk_index: 0,
        chunk_text: 'keyword match',
        metadata: {},
      };

      const builder: Record<string, any> = {};
      ['select', 'eq', 'textSearch', 'limit'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) => resolve({ data: [keywordResult] });

      const db: any = {
        from: jest.fn(() => builder),
        rpc: jest.fn(() => ({
          then: (resolve: any) =>
            resolve({ data: [vectorResult], error: null }),
        })),
      };

      const results = await hybridSearch(db, 'org1', 'test query');
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('v1');
      expect(results[1].similarity).toBe(0.5); // keyword base score
    });

    it('deduplicates overlapping results', async () => {
      const shared = {
        id: 'shared1',
        source_type: 'evidence',
        source_id: 'e1',
        chunk_index: 0,
        chunk_text: 'overlap',
        metadata: {},
        similarity: 0.9,
      };

      const builder: Record<string, any> = {};
      ['select', 'eq', 'textSearch', 'limit'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) => resolve({ data: [{ ...shared }] });

      const db: any = {
        from: jest.fn(() => builder),
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: [shared], error: null }),
        })),
      };

      const results = await hybridSearch(db, 'org1', 'overlap');
      expect(results.length).toBe(1);
    });

    it('handles null keyword results', async () => {
      const builder: Record<string, any> = {};
      ['select', 'eq', 'textSearch', 'limit'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) => resolve({ data: null });

      const db: any = {
        from: jest.fn(() => builder),
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: [], error: null }),
        })),
      };

      const results = await hybridSearch(db, 'org1', 'query');
      expect(results).toEqual([]);
    });

    it('uses custom limit', async () => {
      const builder: Record<string, any> = {};
      ['select', 'eq', 'textSearch', 'limit'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) => resolve({ data: [] });

      const db: any = {
        from: jest.fn(() => builder),
        rpc: jest.fn(() => ({
          then: (resolve: any) => resolve({ data: [], error: null }),
        })),
      };

      await hybridSearch(db, 'org1', 'query', { limit: 3 });
      // Just verify it doesn't throw with custom limit
      expect(db.rpc).toHaveBeenCalled();
    });
  });

  describe('getIndexStats', () => {
    it('returns stats for indexed documents', async () => {
      const builder: Record<string, any> = {};
      ['select', 'eq'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) =>
        resolve({
          data: [
            {
              source_type: 'evidence',
              chunk_count: 10,
              indexed_at: '2024-01-01T00:00:00Z',
            },
            {
              source_type: 'policy',
              chunk_count: 5,
              indexed_at: '2024-01-02T00:00:00Z',
            },
            {
              source_type: 'evidence',
              chunk_count: 8,
              indexed_at: '2024-01-03T00:00:00Z',
            },
          ],
        });

      const db: any = { from: jest.fn(() => builder) };
      const stats = await getIndexStats(db, 'org1');
      expect(stats.totalChunks).toBe(23);
      expect(stats.bySourceType.evidence).toBe(18);
      expect(stats.bySourceType.policy).toBe(5);
      expect(stats.lastIndexed).toBe('2024-01-03T00:00:00Z');
    });

    it('returns empty stats when no data', async () => {
      const builder: Record<string, any> = {};
      ['select', 'eq'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) => resolve({ data: null });

      const db: any = { from: jest.fn(() => builder) };
      const stats = await getIndexStats(db, 'org1');
      expect(stats.totalChunks).toBe(0);
      expect(stats.bySourceType).toEqual({});
      expect(stats.lastIndexed).toBeNull();
    });

    it('handles null chunk_count', async () => {
      const builder: Record<string, any> = {};
      ['select', 'eq'].forEach((m) => {
        builder[m] = jest.fn(() => builder);
      });
      builder.then = (resolve: any) =>
        resolve({
          data: [
            {
              source_type: 'task',
              chunk_count: null,
              indexed_at: '2024-01-01T00:00:00Z',
            },
          ],
        });

      const db: any = { from: jest.fn(() => builder) };
      const stats = await getIndexStats(db, 'org1');
      expect(stats.totalChunks).toBe(0);
      expect(stats.bySourceType.task).toBe(0);
    });
  });
});
