/**
 * Tests for lib/evidence/coverage-calculator.ts
 */

jest.mock('server-only', () => ({}));

function createBuilder(result = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdmin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

import {
  calculateCoverage,
  identifyGaps,
} from '@/lib/evidence/coverage-calculator';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('calculateCoverage', () => {
  it('returns 100% when no controls exist', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: 0 }),
    );
    const result = await calculateCoverage('org-1');
    expect(result.coverage).toBe(100);
    expect(result.totalControls).toBe(0);
  });

  it('calculates coverage with evidence', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        // org_controls count
        return createBuilder({ data: null, error: null, count: 10 });
      }
      // org_evidence with control_ids
      return createBuilder({
        data: [
          { control_id: 'c1' },
          { control_id: 'c2' },
          { control_id: 'c2' }, // duplicate
          { control_id: 'c3' },
        ],
        error: null,
        count: null,
      });
    });

    const result = await calculateCoverage('org-1');
    expect(result.totalControls).toBe(10);
    expect(result.coveredControls).toBe(3);
    expect(result.coverage).toBe(30);
  });

  it('applies frameworkId filter when provided', async () => {
    const builder = createBuilder({ data: null, error: null, count: 5 });
    mockAdmin.from = jest.fn(() => builder);
    await calculateCoverage('org-1', 'fw-1');
    // eq should be called with framework_id
    expect(builder.eq).toHaveBeenCalled();
  });

  it('handles null evidence data', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({ data: null, error: null, count: 5 });
      }
      return createBuilder({ data: null, error: null, count: null });
    });

    const result = await calculateCoverage('org-1');
    expect(result.coveredControls).toBe(0);
    expect(result.coverage).toBe(0);
  });
});

describe('identifyGaps', () => {
  it('returns empty array when no controls', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: [], error: null, count: null }),
    );
    const gaps = await identifyGaps('org-1');
    expect(gaps).toEqual([]);
  });

  it('returns empty array when controls is null', async () => {
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: null, count: null }),
    );
    const gaps = await identifyGaps('org-1');
    expect(gaps).toEqual([]);
  });

  it('identifies controls with no evidence as gaps', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: [
            { id: 'c1', code: 'CTL-001', title: 'Control 1', priority: 'high' },
            {
              id: 'c2',
              code: 'CTL-002',
              title: 'Control 2',
              priority: 'medium',
            },
          ],
          error: null,
          count: null,
        });
      }
      return createBuilder({ data: [], error: null, count: null });
    });

    const gaps = await identifyGaps('org-1');
    expect(gaps.length).toBe(2);
    expect(gaps[0].reason).toBe('no_evidence');
    expect(gaps[0].controlCode).toBe('CTL-001');
  });

  it('identifies expired evidence as gaps', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: [
            {
              id: 'c1',
              code: 'CTL-001',
              title: 'Control 1',
              priority: 'critical',
            },
          ],
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: [{ control_id: 'c1', freshness_status: 'expired' }],
        error: null,
        count: null,
      });
    });

    const gaps = await identifyGaps('org-1');
    expect(gaps.length).toBe(1);
    expect(gaps[0].reason).toBe('expired_evidence');
  });

  it('identifies needs_review evidence as gaps', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: [
            { id: 'c1', code: 'CTL-001', title: 'Control 1', priority: 'low' },
          ],
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: [{ control_id: 'c1', freshness_status: 'needs_review' }],
        error: null,
        count: null,
      });
    });

    const gaps = await identifyGaps('org-1');
    expect(gaps.length).toBe(1);
    expect(gaps[0].reason).toBe('needs_review');
  });

  it('applies frameworkId filter to query', async () => {
    const builder = createBuilder({ data: [], error: null, count: null });
    mockAdmin.from = jest.fn(() => builder);
    await identifyGaps('org-1', 'fw-1');
    expect(builder.eq).toHaveBeenCalled();
  });

  it('handles evidence with null control_id', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return createBuilder({
          data: [
            {
              id: 'c1',
              code: 'CTL-001',
              title: 'Control 1',
              priority: 'medium',
            },
          ],
          error: null,
          count: null,
        });
      }
      return createBuilder({
        data: [{ control_id: null, freshness_status: 'current' }],
        error: null,
        count: null,
      });
    });

    const gaps = await identifyGaps('org-1');
    expect(gaps.length).toBe(1);
    expect(gaps[0].reason).toBe('no_evidence');
  });
});
