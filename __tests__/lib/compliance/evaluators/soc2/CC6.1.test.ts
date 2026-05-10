/**
 * Tests for lib/compliance/evaluators/soc2/CC6.1.ts — logical access (MFA coverage)
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC6.1';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
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
      if (!handler) {
        throw new Error(`Unexpected table: ${table}`);
      }
      return makeChain({ data: handler.data, error: handler.error ?? null });
    }),
  } as unknown as ControlEvaluatorContext['db'];
}

const ctx = (db: ControlEvaluatorContext['db']): ControlEvaluatorContext => ({
  orgId: 'org-1',
  db,
});

describe('SOC2 CC6.1 — logical access (MFA coverage)', () => {
  it('passes when all active members have user_security with 2FA enabled', async () => {
    const db = makeDb({
      org_members: {
        data: [
          { id: 'm1', user_id: 'u1' },
          { id: 'm2', user_id: 'u2' },
        ],
      },
      user_security: {
        data: [
          { user_id: 'u1', two_factor_enabled: true },
          { user_id: 'u2', two_factor_enabled: true },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.controlCode).toBe('CC6.1');
    expect(result.confidence).toBe(1);
    expect(result.gaps).toEqual([]);
    expect(result.evidenceRefs.length).toBe(2);
  });

  it('fails when most members lack 2FA enrollment', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
        })),
      },
      user_security: {
        data: Array.from({ length: 10 }, (_, i) => ({
          user_id: `u${i}`,
          two_factor_enabled: i < 4,
        })),
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'mfa_disabled')).toBe(true);
  });

  it('returns partial when coverage is 60-95%', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
        })),
      },
      user_security: {
        data: Array.from({ length: 10 }, (_, i) => ({
          user_id: `u${i}`,
          two_factor_enabled: i < 8,
        })),
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'mfa_disabled')).toBe(true);
  });

  it('returns not_evaluated when most members lack any user_security row', async () => {
    const db = makeDb({
      org_members: {
        data: Array.from({ length: 10 }, (_, i) => ({
          id: `m${i}`,
          user_id: `u${i}`,
        })),
      },
      user_security: {
        // Only 2 of 10 members have a row at all → completeness = 0.2 < 0.4
        data: [
          { user_id: 'u0', two_factor_enabled: true },
          { user_id: 'u1', two_factor_enabled: true },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps.some((g) => g.code === 'missing_user_security')).toBe(
      true,
    );
    expect(result.gaps.some((g) => g.code === 'insufficient_data')).toBe(true);
  });

  it('returns not_evaluated when org has no active members', async () => {
    const db = makeDb({
      org_members: { data: [] },
      user_security: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_active_members');
  });
});
