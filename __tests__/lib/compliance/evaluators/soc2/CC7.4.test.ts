/**
 * Tests for lib/compliance/evaluators/soc2/CC7.4.ts — actor attribution on config changes
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC7.4';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
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

describe('SOC2 CC7.4 — actor attribution on config changes', () => {
  it('passes when all config-mutating entries have a real actor', async () => {
    const audit = Array.from({ length: 20 }, (_, i) => ({
      id: `a${i}`,
      action: i % 2 === 0 ? 'policy.update' : 'role.assign',
      actor_email: `user${i}@example.com`,
      created_at: '2026-04-01',
    }));
    const db = makeDb({ org_audit_logs: { data: audit } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when most config entries are anonymous/system-actor', async () => {
    const audit = Array.from({ length: 20 }, (_, i) => ({
      id: `a${i}`,
      action: 'config.update',
      actor_email: i < 15 ? 'system@formaos.com' : `user${i}@example.com`,
      created_at: '2026-04-01',
    }));
    const db = makeDb({ org_audit_logs: { data: audit } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('majority_anonymous_changes');
  });

  it('returns partial when 60-95% of config entries carry a real actor', async () => {
    const audit = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      action: 'permission.update',
      actor_email: i < 8 ? `user${i}@example.com` : 'system@formaos.com',
      created_at: '2026-04-01',
    }));
    const db = makeDb({ org_audit_logs: { data: audit } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'sparse_actor_attribution')).toBe(
      true,
    );
  });

  it('returns partial when no config-mutating entries exist in window', async () => {
    const audit = [
      {
        id: 'a1',
        action: 'page.viewed',
        actor_email: 'user@example.com',
        created_at: '2026-04-01',
      },
    ];
    const db = makeDb({ org_audit_logs: { data: audit } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps[0].code).toBe('no_config_actions');
  });

  it('returns not_evaluated when audit log is empty', async () => {
    const db = makeDb({ org_audit_logs: { data: [] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_audit_entries');
  });
});
