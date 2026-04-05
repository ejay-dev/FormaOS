/**
 * Tests for lib/ai/indexing-pipeline.ts
 *
 * Pure pipeline functions that take a SupabaseClient as parameter.
 * Exports: indexEntity, removeEntityIndex, fullReindex, incrementalIndex
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/ai/vector-store', () => ({
  indexDocument: jest.fn().mockResolvedValue(1),
  deleteDocumentIndex: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/ai/embeddings', () => ({
  stripMarkdown: jest.fn((text: string) => text),
}));

import {
  indexEntity,
  removeEntityIndex,
  fullReindex,
  incrementalIndex,
} from '@/lib/ai/indexing-pipeline';
import { indexDocument, deleteDocumentIndex } from '@/lib/ai/vector-store';

function createBuilder(result = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

function createMockDb(fromImpl?: (table: string) => any) {
  return {
    from: jest.fn(fromImpl ?? (() => createBuilder())),
  } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('indexEntity', () => {
  it('indexes evidence document', async () => {
    const evidence = {
      title: 'SOC2 Evidence',
      description: 'Description here',
      file_name: 'report.pdf',
      tags: ['soc2', 'annual'],
      control_id: 'ctrl-1',
      created_at: '2024-01-01T00:00:00Z',
    };

    const db = createMockDb(() =>
      createBuilder({ data: evidence, error: null }),
    );
    const count = await indexEntity(db, 'org-1', 'evidence', 'ev-1');

    expect(count).toBe(1);
    expect(indexDocument).toHaveBeenCalledWith(
      db,
      'org-1',
      'evidence',
      'ev-1',
      expect.stringContaining('SOC2 Evidence'),
      expect.objectContaining({
        metadata: expect.objectContaining({ type: 'evidence' }),
      }),
    );
  });

  it('indexes policy document with markdown stripping', async () => {
    const policy = {
      title: 'Data Policy',
      content: '## Policy Content',
      status: 'active',
      version: 2,
      category: 'Security',
      created_at: '2024-01-01T00:00:00Z',
    };

    const db = createMockDb(() => createBuilder({ data: policy, error: null }));
    await indexEntity(db, 'org-1', 'policy', 'pol-1');

    expect(indexDocument).toHaveBeenCalledWith(
      db,
      'org-1',
      'policy',
      'pol-1',
      expect.stringContaining('Data Policy'),
      expect.objectContaining({
        metadata: expect.objectContaining({
          type: 'policy',
          category: 'Security',
        }),
      }),
    );
  });

  it('indexes control document', async () => {
    const control = {
      control_id: 'CC-1.1',
      title: 'Access Control',
      description: 'Manages access',
      category: 'Security',
      status: 'active',
      framework_id: 'soc2',
    };

    const db = createMockDb(() =>
      createBuilder({ data: control, error: null }),
    );
    await indexEntity(db, 'org-1', 'control', 'ctrl-1');

    expect(indexDocument).toHaveBeenCalledWith(
      db,
      'org-1',
      'control',
      'ctrl-1',
      expect.stringContaining('CC-1.1'),
      expect.objectContaining({
        metadata: expect.objectContaining({ type: 'control' }),
      }),
    );
  });

  it('indexes task document', async () => {
    const task = {
      title: 'Review Policy',
      description: 'Annual review',
      status: 'open',
      priority: 'high',
      due_date: '2024-12-31',
    };

    const db = createMockDb(() => createBuilder({ data: task, error: null }));
    await indexEntity(db, 'org-1', 'task', 'task-1');

    expect(indexDocument).toHaveBeenCalledWith(
      db,
      'org-1',
      'task',
      'task-1',
      expect.stringContaining('Review Policy'),
      expect.objectContaining({
        metadata: expect.objectContaining({ type: 'task' }),
      }),
    );
  });

  it('indexes form submission', async () => {
    const submission = {
      data: { 'field-1': 'Answer 1', 'field-2': 42 },
      form: {
        title: 'Risk Assessment',
        fields: [
          { id: 'field-1', label: 'Question 1' },
          { id: 'field-2', label: 'Score' },
        ],
      },
      created_at: '2024-06-01T00:00:00Z',
      respondent_name: 'John Doe',
    };

    const db = createMockDb(() =>
      createBuilder({ data: submission, error: null }),
    );
    await indexEntity(db, 'org-1', 'form_submission', 'sub-1');

    expect(indexDocument).toHaveBeenCalledWith(
      db,
      'org-1',
      'form_submission',
      'sub-1',
      expect.stringContaining('Risk Assessment'),
      expect.anything(),
    );
  });

  it('returns 0 when entity not found in DB', async () => {
    const db = createMockDb(() => createBuilder({ data: null, error: null }));
    const count = await indexEntity(db, 'org-1', 'evidence', 'missing');
    expect(count).toBe(0);
    expect(indexDocument).not.toHaveBeenCalled();
  });

  it('returns 0 for unknown source type', async () => {
    const db = createMockDb();
    const count = await indexEntity(db, 'org-1', 'unknown_type' as any, 'id-1');
    expect(count).toBe(0);
  });

  it('handles care_plan source type (stub returns null)', async () => {
    const db = createMockDb();
    const count = await indexEntity(db, 'org-1', 'care_plan', 'cp-1');
    expect(count).toBe(0);
  });
});

describe('removeEntityIndex', () => {
  it('deletes the document index', async () => {
    const db = createMockDb();
    await removeEntityIndex(db, 'org-1', 'evidence', 'ev-1');
    expect(deleteDocumentIndex).toHaveBeenCalledWith(
      db,
      'org-1',
      'evidence',
      'ev-1',
    );
  });
});

describe('fullReindex', () => {
  it('indexes all entity types for an org', async () => {
    const db = createMockDb((table: string) => {
      if (table === 'evidence')
        return createBuilder({
          data: [{ id: 'e1' }, { id: 'e2' }],
          error: null,
        });
      if (table === 'policies')
        return createBuilder({ data: [{ id: 'p1' }], error: null });
      if (table === 'org_compliance_controls')
        return createBuilder({ data: [{ id: 'c1' }], error: null });
      if (table === 'tasks')
        return createBuilder({ data: [{ id: 't1' }], error: null });
      // Individual entity fetches return data
      return createBuilder({
        data: {
          title: 'Test',
          description: 'Desc',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });
    });

    const result = await fullReindex(db, 'org-1');

    expect(result.indexed).toBeGreaterThanOrEqual(4);
    expect(result.errors).toBe(0);
  });

  it('counts errors when indexEntity throws', async () => {
    (indexDocument as jest.Mock).mockRejectedValue(
      new Error('Embedding failed'),
    );

    const db = createMockDb((table: string) => {
      if (table === 'evidence')
        return createBuilder({ data: [{ id: 'e1' }], error: null });
      if (table === 'policies') return createBuilder({ data: [], error: null });
      if (table === 'org_compliance_controls')
        return createBuilder({ data: [], error: null });
      if (table === 'tasks') return createBuilder({ data: [], error: null });
      return createBuilder({
        data: {
          title: 'Test',
          description: 'Desc',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });
    });

    const result = await fullReindex(db, 'org-1');

    // Evidence should fail, but others are empty so no errors from them
    expect(result.errors).toBeGreaterThanOrEqual(1);
  });

  it('handles empty org gracefully', async () => {
    const db = createMockDb(() => createBuilder({ data: [], error: null }));
    const result = await fullReindex(db, 'org-empty');
    expect(result.indexed).toBe(0);
    expect(result.errors).toBe(0);
  });
});

describe('incrementalIndex', () => {
  it('indexes only documents updated since timestamp', async () => {
    (indexDocument as jest.Mock).mockResolvedValue(1);
    const since = '2024-06-01T00:00:00Z';

    const db = createMockDb((table: string) => {
      if (table === 'evidence')
        return createBuilder({ data: [{ id: 'e1' }], error: null });
      if (table === 'policies')
        return createBuilder({ data: [{ id: 'p1' }], error: null });
      if (table === 'tasks') return createBuilder({ data: [], error: null });
      return createBuilder({
        data: {
          title: 'Updated',
          description: 'D',
          status: 'active',
          created_at: '2024-06-02T00:00:00Z',
        },
        error: null,
      });
    });

    const result = await incrementalIndex(db, 'org-1', since);
    expect(result.indexed).toBe(2); // evidence + policy
    expect(result.errors).toBe(0);
  });

  it('returns zero when nothing updated', async () => {
    const db = createMockDb(() => createBuilder({ data: [], error: null }));
    const result = await incrementalIndex(db, 'org-1', '2024-06-01T00:00:00Z');
    expect(result.indexed).toBe(0);
    expect(result.errors).toBe(0);
  });
});
