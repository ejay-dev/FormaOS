/**
 * Tests for lib/compliance/evaluators/soc2/CC6.6.ts — privileged access restricted
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC6.6';
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

describe('SOC2 CC6.6 — privileged access restricted', () => {
  it('passes when 1-5 privileged members exist', async () => {
    const db = makeDb({
      org_members: {
        data: [
          { id: 'm1', user_id: 'u1', role: 'owner' },
          { id: 'm2', user_id: 'u2', role: 'admin' },
          { id: 'm3', user_id: 'u3', role: 'member' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.evidenceRefs.length).toBe(2);
    expect(result.confidence).toBe(1);
  });

  it('fails when more than 10 privileged members exist', async () => {
    const db = makeDb({
      org_members: {
        data: [
          ...Array.from({ length: 11 }, (_, i) => ({
            id: `m${i}`,
            user_id: `u${i}`,
            role: 'admin',
          })),
          { id: 'm99', user_id: 'u99', role: 'member' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'excessive_privileged_users')).toBe(
      true,
    );
  });

  it('returns partial when 6-10 privileged members exist', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 7 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
          role: 'admin',
        })),
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'too_many_privileged_users')).toBe(
      true,
    );
  });

  it('fails when no privileged members exist', async () => {
    const db = makeDb({
      org_members: {
        data: [
          { id: 'm1', user_id: 'u1', role: 'member' },
          { id: 'm2', user_id: 'u2', role: 'viewer' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('no_privileged_users');
  });

  it('returns not_evaluated when org has no active members', async () => {
    const db = makeDb({ org_members: { data: [] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_active_members');
  });
});
