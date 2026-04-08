jest.mock('@/lib/supabase/server', () => {
  const query: Record<string, jest.Mock> = {};
  query.from = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.insert = jest.fn(() => query);
  query.update = jest.fn(() => query);
  query.upsert = jest.fn(() => Promise.resolve({ error: null }));
  query.eq = jest.fn(() => query);
  query.in = jest.fn(() => query);
  query.lte = jest.fn(() => query);
  query.gte = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.single = jest.fn(() => query);
  query.then = jest.fn((r: Function) =>
    r({ data: null, error: null, count: 0 }),
  );

  const client = { from: jest.fn(() => query) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(client),
    __query: query,
    __client: client,
  };
});

import {
  getRetentionPolicies,
  createRetentionPolicy,
  createLegalHold,
  releaseLegalHold,
  addDocumentToHold,
  logDocumentAction,
  getDocumentsExpiringSoon,
} from '@/lib/retention/retention-engine';

function q() {
  return require('@/lib/supabase/server').__query;
}

beforeEach(() => {
  const query = q();
  query.from.mockImplementation(() => query);
  query.select.mockImplementation(() => query);
  query.insert.mockImplementation(() => query);
  query.update.mockImplementation(() => query);
  query.upsert.mockImplementation(() => Promise.resolve({ error: null }));
  query.eq.mockImplementation(() => query);
  query.in.mockImplementation(() => query);
  query.lte.mockImplementation(() => query);
  query.gte.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.single.mockImplementation(() => query);
  query.then.mockImplementation((r: Function) =>
    r({ data: null, error: null, count: 0 }),
  );
  require('@/lib/supabase/server').__client.from.mockImplementation(
    () => query,
  );
});

describe('getRetentionPolicies', () => {
  it('queries active policies', async () => {
    q().then.mockImplementation((r: Function) =>
      r({ data: [{ id: '1', name: 'Evidence' }], error: null }),
    );
    const result = await getRetentionPolicies('org-1');
    expect(result).toEqual([{ id: '1', name: 'Evidence' }]);
  });

  it('returns empty array when no data', async () => {
    q().then.mockImplementation((r: Function) =>
      r({ data: null, error: null }),
    );
    const result = await getRetentionPolicies('org-1');
    expect(result).toEqual([]);
  });
});

describe('createRetentionPolicy', () => {
  it('inserts policy', async () => {
    q().insert.mockReturnValue(Promise.resolve({ error: null }));
    await createRetentionPolicy('org-1', {
      name: 'Evidence Retention',
      documentCategory: 'evidence',
      retentionPeriodDays: 365,
      actionOnExpiry: 'archive',
    });
    expect(q().insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        document_category: 'evidence',
        retention_period_days: 365,
      }),
    );
  });

  it('throws on error', async () => {
    q().insert.mockReturnValue(Promise.resolve({ error: { message: 'err' } }));
    await expect(
      createRetentionPolicy('org-1', {
        name: 'X',
        documentCategory: 'x',
        retentionPeriodDays: 1,
        actionOnExpiry: 'delete',
      }),
    ).rejects.toBeDefined();
  });
});

describe('createLegalHold', () => {
  it('creates and returns hold', async () => {
    q().single.mockReturnValue(
      Promise.resolve({ data: { id: 'hold-1' }, error: null }),
    );
    const result = await createLegalHold('org-1', {
      name: 'ACME',
      reason: 'Lawsuit',
      createdBy: 'u1',
    });
    expect(result).toEqual({ id: 'hold-1' });
  });

  it('throws on error', async () => {
    q().single.mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'fail' } }),
    );
    await expect(
      createLegalHold('org-1', { name: 'X', reason: 'Y', createdBy: 'u' }),
    ).rejects.toBeDefined();
  });
});

describe('releaseLegalHold', () => {
  it('updates status and logs release', async () => {
    q().then.mockImplementation((r: Function) =>
      r({
        data: [{ document_type: 'evidence', document_id: 'doc-1' }],
        error: null,
      }),
    );
    q().insert.mockReturnValue(Promise.resolve({ error: null }));
    await releaseLegalHold('org-1', 'hold-1', 'user-1');
    expect(q().update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'released', released_by: 'user-1' }),
    );
  });
});

describe('addDocumentToHold', () => {
  it('upserts document and logs action', async () => {
    q().insert.mockReturnValue(Promise.resolve({ error: null }));
    await addDocumentToHold('org-1', 'hold-1', {
      documentType: 'evidence',
      documentId: 'd1',
      addedBy: 'u1',
    });
    expect(q().upsert).toHaveBeenCalled();
  });
});

describe('logDocumentAction', () => {
  it('inserts lifecycle log', async () => {
    q().insert.mockReturnValue(Promise.resolve({ error: null }));
    await logDocumentAction('org-1', {
      documentType: 'evidence',
      documentId: 'd1',
      action: 'archived',
    });
    expect(q().insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'archived' }),
    );
  });
});

describe('getDocumentsExpiringSoon', () => {
  it('returns empty when no policies', async () => {
    q().then.mockImplementation((r: Function) => r({ data: [], error: null }));
    const result = await getDocumentsExpiringSoon('org-1');
    expect(result).toEqual([]);
  });

  it('finds expiring evidence docs', async () => {
    let callIdx = 0;
    q().then.mockImplementation((r: Function) => {
      callIdx++;
      if (callIdx === 1) {
        return r({
          data: [
            {
              document_category: 'evidence',
              retention_period_days: 365,
              action_on_expiry: 'archive',
              name: 'Evidence Policy',
            },
          ],
          error: null,
        });
      }
      return r({ data: null, error: null, count: 5 });
    });
    const result = await getDocumentsExpiringSoon('org-1', 30);
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('evidence');
  });
});
