/**
 * Tests for lib/compliance/evaluators/soc2/CC3.1.ts — risk register
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC3.1';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
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

describe('SOC2 CC3.1 — risk register', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes with at least one fully scored, fresh risk', async () => {
    const db = makeDb({
      org_risks: {
        data: [
          {
            id: 'r1',
            status: 'open',
            likelihood: 3,
            impact: 4,
            risk_score: 12,
            updated_at: daysAgo(30),
            created_at: daysAgo(60),
          },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when the register is empty', async () => {
    const db = makeDb({ org_risks: { data: [] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('empty_risk_register');
  });

  it('returns partial when scoring is incomplete', async () => {
    const db = makeDb({
      org_risks: {
        data: [
          {
            id: 'r1',
            status: 'open',
            likelihood: 3,
            impact: 4,
            risk_score: 12,
            updated_at: daysAgo(30),
            created_at: daysAgo(60),
          },
          {
            id: 'r2',
            status: 'open',
            likelihood: null,
            impact: null,
            risk_score: null,
            updated_at: daysAgo(20),
            created_at: daysAgo(40),
          },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'partial_risk_scoring')).toBe(
      true,
    );
  });

  it('fails when risks exist but all are stale', async () => {
    const db = makeDb({
      org_risks: {
        data: [
          {
            id: 'r1',
            status: 'open',
            likelihood: 3,
            impact: 4,
            risk_score: 12,
            updated_at: daysAgo(400),
            created_at: daysAgo(500),
          },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'stale_risk_register')).toBe(
      true,
    );
  });

  it('returns not_evaluated when the org_risks table is unreachable', async () => {
    const db = makeDb({
      org_risks: {
        data: null,
        error: { message: 'relation "org_risks" does not exist' },
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('org_risks_unavailable');
  });
});
