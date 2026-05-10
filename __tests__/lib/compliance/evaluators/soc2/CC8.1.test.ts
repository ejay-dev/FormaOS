/**
 * Tests for lib/compliance/evaluators/soc2/CC8.1.ts — policy review cadence
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC8.1';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

function makeDb(handlers: Record<string, { data: FakeRow[] | null; error?: unknown }>) {
  return {
    from: jest.fn((table: string) => {
      const handler = handlers[table];
      if (!handler) throw new Error(`Unexpected table: ${table}`);
      return makeChain({ data: handler.data, error: handler.error ?? null });
    }),
  } as unknown as ControlEvaluatorContext['db'];
}

const ctx = (db: ControlEvaluatorContext['db']): ControlEvaluatorContext => ({
  orgId: 'org-1',
  db,
});

const NOW = new Date('2026-05-10T00:00:00Z');
const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('SOC2 CC8.1 — policy review cadence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes when every active policy reviewed within 365d', async () => {
    const db = makeDb({
      org_policies: {
        data: [
          { id: 'p1', status: 'published', title: 'Access' },
          { id: 'p2', status: 'active', title: 'Backup' },
        ],
      },
      policy_review_schedules: {
        data: [
          { id: 's1', policy_id: 'p1', last_reviewed_at: daysAgo(60), next_review_date: '2026-12-01' },
          { id: 's2', policy_id: 'p2', last_reviewed_at: daysAgo(120), next_review_date: '2026-09-01' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when most policies are overdue or missing schedules', async () => {
    const db = makeDb({
      org_policies: {
        data: Array.from({ length: 5 }, (_, i) => ({
          id: `p${i}`,
          status: 'published',
          title: `Policy ${i}`,
        })),
      },
      policy_review_schedules: {
        data: [
          { id: 's0', policy_id: 'p0', last_reviewed_at: daysAgo(60), next_review_date: '2026-12-01' },
          { id: 's1', policy_id: 'p1', last_reviewed_at: daysAgo(500), next_review_date: '2025-12-01' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'no_review_schedule')).toBe(true);
  });

  it('returns partial when 60-95% of policies are compliant', async () => {
    const db = makeDb({
      org_policies: {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `p${i}`,
          status: 'published',
          title: `Policy ${i}`,
        })),
      },
      policy_review_schedules: {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `s${i}`,
          policy_id: `p${i}`,
          last_reviewed_at: i < 8 ? daysAgo(60) : daysAgo(500),
          next_review_date: '2026-12-01',
        })),
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'overdue_review')).toBe(true);
  });

  it('returns not_evaluated when org has no active policies', async () => {
    const db = makeDb({
      org_policies: { data: [] },
      policy_review_schedules: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_active_policies');
  });
});
