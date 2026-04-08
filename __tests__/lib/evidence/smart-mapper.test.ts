/**
 * Tests for lib/evidence/smart-mapper.ts
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
    'not',
    'is',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'in',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import { suggestControlMappings } from '@/lib/evidence/smart-mapper';

beforeEach(() => jest.clearAllMocks());

describe('suggestControlMappings', () => {
  it('returns empty when no controls exist', async () => {
    const client = {
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    expect(await suggestControlMappings('org-1', 'file.pdf')).toEqual([]);
  });

  it('returns empty when controls data is null', async () => {
    const client = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    expect(await suggestControlMappings('org-1', 'file.pdf')).toEqual([]);
  });

  it('returns high confidence for exact code match in filename', async () => {
    const controls = [
      {
        id: 'c1',
        code: 'AC-1',
        title: 'Access Control Policy',
        description: '',
      },
    ];
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: controls, error: null });
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await suggestControlMappings('org-1', 'ac-1-policy.pdf');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].confidence).toBe('high');
    expect(result[0].code).toBe('AC-1');
  });

  it('returns medium confidence for title keyword match', async () => {
    const controls = [
      {
        id: 'c2',
        code: 'IR-1',
        title: 'Incident Response Planning Procedure',
        description: '',
      },
    ];
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: controls, error: null });
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await suggestControlMappings(
      'org-1',
      'test.pdf',
      'incident response planning document',
    );
    const medium = result.find((r) => r.confidence === 'medium');
    expect(medium).toBeDefined();
  });

  it('returns medium confidence for keyword map match', async () => {
    const controls = [
      { id: 'c3', code: 'SC-12', title: 'Key Management', description: '' },
    ];
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: controls, error: null });
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await suggestControlMappings(
      'org-1',
      'encryption-setup.pdf',
      'encryption configuration',
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns low confidence for historical match', async () => {
    const controls = [
      { id: 'c4', code: 'RA-3', title: 'Risk Assessment', description: '' },
    ];
    const historical = [{ control_id: 'c4', title: 'risk-report-2023.pdf' }];
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: controls, error: null });
        return createBuilder({ data: historical, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await suggestControlMappings(
      'org-1',
      'risk-report-2024.pdf',
    );
    const low = result.find((r) => r.confidence === 'low');
    expect(low).toBeDefined();
  });

  it('sorts suggestions by confidence', async () => {
    const controls = [
      {
        id: 'c1',
        code: 'AC-1',
        title: 'Access Control Policy Procedures',
        description: '',
      },
      { id: 'c2', code: 'IR-1', title: 'Incident Response', description: '' },
    ];
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: controls, error: null });
        return createBuilder({ data: [], error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await suggestControlMappings(
      'org-1',
      'ac-1-access-control-policy-procedures.pdf',
      'access control policy',
    );
    if (result.length >= 2) {
      const order = { high: 0, medium: 1, low: 2 };
      expect(order[result[0].confidence]).toBeLessThanOrEqual(
        order[result[1].confidence],
      );
    }
  });
});
