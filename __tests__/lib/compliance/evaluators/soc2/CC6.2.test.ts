/**
 * Tests for lib/compliance/evaluators/soc2/CC6.2.ts — new user registration auditable
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC6.2';
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

describe('SOC2 CC6.2 — new user registration', () => {
  it('passes when every non-founder member has a matching invitation', async () => {
    const db = makeDb({
      org_members: {
        data: [
          { id: 'm1', user_id: 'u1', created_at: '2026-01-01' },
          { id: 'm2', user_id: 'u2', created_at: '2026-02-01' },
          { id: 'm3', user_id: 'u3', created_at: '2026-03-01' },
        ],
      },
      team_invitations: {
        data: [
          {
            id: 'i1',
            accepted_by: 'u2',
            accepted_at: '2026-02-01',
            status: 'accepted',
          },
          {
            id: 'i2',
            accepted_by: 'u3',
            accepted_at: '2026-03-01',
            status: 'accepted',
          },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.gaps).toEqual([]);
  });

  it('fails when most members joined without an invitation record', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 11 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
          created_at: `2026-0${(i % 9) + 1}-01`,
        })),
      },
      team_invitations: {
        data: [
          {
            id: 'i1',
            accepted_by: 'u2',
            accepted_at: '2026-02-01',
            status: 'accepted',
          },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'no_invitation_record')).toBe(
      true,
    );
  });

  it('returns partial when invitation match rate is 60-95%', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 11 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
          created_at: `2026-0${(i % 9) + 1}-01`,
        })),
      },
      team_invitations: {
        // Match 8 of 10 non-founders → 80%
        data: Array.from({ length: 8 }, (_, i) => ({
          id: `i${i}`,
          accepted_by: `u${i + 1}`,
          accepted_at: '2026-02-01',
          status: 'accepted',
        })),
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
  });

  it('returns not_evaluated when org has no members', async () => {
    const db = makeDb({
      org_members: { data: [] },
      team_invitations: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_members');
  });

  it('passes vacuously for single-member founder-only orgs', async () => {
    const db = makeDb({
      org_members: {
        data: [{ id: 'm1', user_id: 'u1', created_at: '2026-01-01' }],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.confidence).toBe(0.7);
  });
});
