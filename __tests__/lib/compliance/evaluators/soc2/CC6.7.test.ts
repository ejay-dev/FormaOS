/**
 * Tests for lib/compliance/evaluators/soc2/CC6.7.ts — restricts information movement
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC6.7';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
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
      if (!handler) throw new Error(`Unexpected table: ${table}`);
      return makeChain({ data: handler.data, error: handler.error ?? null });
    }),
  } as unknown as ControlEvaluatorContext['db'];
}

const ctx = (db: ControlEvaluatorContext['db']): ControlEvaluatorContext => ({
  orgId: 'org-1',
  db,
});

describe('SOC2 CC6.7 — restricts information movement', () => {
  it('passes when all active API keys have explicit scopes', async () => {
    const db = makeDb({
      api_keys: {
        data: [
          { id: 'k1', scopes: ['read:patients'], revoked_at: null },
          { id: 'k2', scopes: ['read:reports'], revoked_at: null },
        ],
      },
      org_audit_logs: {
        data: [
          { id: 'a1', action: 'export.requested', created_at: '2026-04-01' },
        ],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.evidenceRefs.length).toBeGreaterThanOrEqual(2);
  });

  it('fails when most active API keys have empty scopes', async () => {
    const db = makeDb({
      api_keys: {
        data: [
          { id: 'k1', scopes: [], revoked_at: null },
          { id: 'k2', scopes: [], revoked_at: null },
          { id: 'k3', scopes: ['read'], revoked_at: null },
        ],
      },
      org_audit_logs: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'majority_unscoped_keys')).toBe(
      true,
    );
  });

  it('returns partial when ≤20% of API keys lack scopes', async () => {
    const db = makeDb({
      api_keys: {
        data: [
          { id: 'k1', scopes: ['read'], revoked_at: null },
          { id: 'k2', scopes: ['write'], revoked_at: null },
          { id: 'k3', scopes: ['read'], revoked_at: null },
          { id: 'k4', scopes: ['read'], revoked_at: null },
          { id: 'k5', scopes: [], revoked_at: null },
        ],
      },
      org_audit_logs: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'unscoped_api_keys')).toBe(true);
  });

  it('returns not_evaluated when there are no API keys and no audit log activity', async () => {
    const db = makeDb({
      api_keys: { data: [] },
      org_audit_logs: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_data_sources');
  });
});
