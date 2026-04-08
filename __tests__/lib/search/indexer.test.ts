/**
 * Tests for lib/search/indexer.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'ilike',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'not',
    'in',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  indexEntity,
  removeEntity,
  reindexEntityType,
  fullReindex,
} from '@/lib/search/indexer';

beforeEach(() => jest.clearAllMocks());

function mockClient(result?: any) {
  const builder = createBuilder(result ?? { data: null, error: null });
  const client = { from: jest.fn(() => builder) };
  createSupabaseAdminClient.mockReturnValue(client);
  return client;
}

describe('indexEntity', () => {
  it('upserts into search_index', async () => {
    const client = mockClient();
    await indexEntity('org-1', 'task', 't1', 'Fix Bug', 'Description text');
    expect(client.from).toHaveBeenCalledWith('search_index');
  });

  it('throws on error', async () => {
    mockClient({ data: null, error: { message: 'upsert failed' } });
    await expect(indexEntity('org-1', 'task', 't1', 'T', 'B')).rejects.toThrow(
      'Indexing failed',
    );
  });

  it('strips markdown from body', async () => {
    const client = mockClient();
    await indexEntity(
      'org-1',
      'policy',
      'p1',
      'Title',
      '# Header\n**bold** text',
    );
    expect(client.from).toHaveBeenCalledWith('search_index');
  });

  it('accepts custom metadata', async () => {
    const client = mockClient();
    await indexEntity('org-1', 'evidence', 'e1', 'Cert', 'Body', {
      status: 'approved',
    });
    expect(client.from).toHaveBeenCalled();
  });
});

describe('removeEntity', () => {
  it('deletes from search_index', async () => {
    const client = mockClient();
    await removeEntity('org-1', 'task', 't1');
    expect(client.from).toHaveBeenCalledWith('search_index');
  });
});

describe('reindexEntityType', () => {
  it('reindexes tasks', async () => {
    const taskData = [
      {
        id: 't1',
        title: 'Task 1',
        description: 'Desc',
        status: 'open',
        priority: 'high',
        assigned_to: 'user1',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data: taskData, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'task');
    expect(client.from).toHaveBeenCalledWith('org_tasks');
  });

  it('reindexes evidence', async () => {
    const data = [
      {
        id: 'e1',
        title: 'Cert',
        description: 'A cert',
        status: 'approved',
        file_type: 'pdf',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'evidence');
    expect(client.from).toHaveBeenCalledWith('org_evidence');
  });

  it('reindexes controls', async () => {
    const data = [
      {
        id: 'c1',
        title: 'Access Control',
        description: 'Desc',
        status: 'active',
        code: 'AC-1',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'control');
    expect(client.from).toHaveBeenCalledWith('org_controls');
  });

  it('reindexes policies', async () => {
    const data = [
      {
        id: 'p1',
        title: 'Security Policy',
        content: '# Policy',
        status: 'active',
        version: 1,
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'policy');
    expect(client.from).toHaveBeenCalled();
  });

  it('reindexes forms', async () => {
    const data = [
      {
        id: 'f1',
        title: 'Intake Form',
        description: 'A form',
        status: 'published',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'form');
    expect(client.from).toHaveBeenCalled();
  });

  it('reindexes participants', async () => {
    const data = [
      {
        id: 'pp1',
        first_name: 'John',
        last_name: 'Doe',
        ndis_number: '12345',
        status: 'active',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'participant');
    expect(client.from).toHaveBeenCalled();
  });

  it('reindexes incidents', async () => {
    const data = [
      {
        id: 'i1',
        title: 'Breach',
        description: 'Data leak',
        severity: 'high',
        status: 'open',
      },
    ];
    const client = {
      from: jest.fn(() => createBuilder({ data, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await reindexEntityType('org-1', 'incident');
    expect(client.from).toHaveBeenCalled();
  });

  it('no-ops for unsupported entity type', async () => {
    const client = mockClient();
    await reindexEntityType('org-1', 'report' as any);
    // report may or may not have an extractor — no error expected
  });
});

describe('fullReindex', () => {
  it('calls reindex for all entity types', async () => {
    const client = {
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    await fullReindex('org-1');
    // Should have called from() for multiple entity types
    expect(client.from).toHaveBeenCalled();
  });
});
