/**
 * Tests for lib/compliance/evaluators/soc2/CC2.1.ts — policy acknowledgement coverage
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC2.1';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
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

describe('SOC2 CC2.1 — policy acknowledgement coverage', () => {
  it('passes when every active policy has ≥80% member acknowledgement', async () => {
    const policies = [
      { id: 'p1', status: 'published', title: 'A' },
      { id: 'p2', status: 'active', title: 'B' },
    ];
    const members = Array.from({ length: 10 }, (_, i) => ({
      user_id: `u${i}`,
    }));
    const acks = members.flatMap((m) =>
      policies.map((p) => ({ policy_id: p.id, user_id: m.user_id })),
    );
    const db = makeDb({
      org_policies: { data: policies },
      org_members: { data: members },
      policy_acknowledgments: { data: acks },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when most policies are below the 80% threshold', async () => {
    const policies = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      status: 'published',
      title: `P${i}`,
    }));
    const members = Array.from({ length: 10 }, (_, i) => ({
      user_id: `u${i}`,
    }));
    // Only one policy gets acks; others get 0.
    const acks = members.map((m) => ({ policy_id: 'p0', user_id: m.user_id }));
    const db = makeDb({
      org_policies: { data: policies },
      org_members: { data: members },
      policy_acknowledgments: { data: acks },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('low_acknowledgement_coverage');
  });

  it('returns partial when 60-95% of policies meet threshold', async () => {
    const policies = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      status: 'published',
      title: `P${i}`,
    }));
    const members = Array.from({ length: 10 }, (_, i) => ({
      user_id: `u${i}`,
    }));
    // First 8 policies fully acknowledged; last 2 unacknowledged.
    const acks = members.flatMap((m) =>
      policies.slice(0, 8).map((p) => ({ policy_id: p.id, user_id: m.user_id })),
    );
    const db = makeDb({
      org_policies: { data: policies },
      org_members: { data: members },
      policy_acknowledgments: { data: acks },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
  });

  it('returns not_evaluated when org has no active policies', async () => {
    const db = makeDb({
      org_policies: { data: [] },
      org_members: { data: [] },
      policy_acknowledgments: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_active_policies');
  });

  it('returns not_evaluated when org has no active members', async () => {
    const db = makeDb({
      org_policies: { data: [{ id: 'p1', status: 'published', title: 'A' }] },
      org_members: { data: [] },
      policy_acknowledgments: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_active_members');
  });
});
