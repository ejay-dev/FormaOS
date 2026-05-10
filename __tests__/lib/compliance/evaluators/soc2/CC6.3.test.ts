/**
 * Tests for lib/compliance/evaluators/soc2/CC6.3.ts — access changes auditable
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC6.3';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
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

describe('SOC2 CC6.3 — access changes auditable', () => {
  it('passes when access-change entries carry before/after metadata', async () => {
    const db = makeDb({
      org_audit_logs: {
        data: [
          {
            id: 'a1',
            action: 'member.role_changed',
            created_at: '2026-04-01',
            metadata: { before: { role: 'member' }, after: { role: 'admin' } },
          },
          {
            id: 'a2',
            action: 'invitation.accepted',
            created_at: '2026-03-01',
            metadata: { from: null, to: 'member' },
          },
        ],
      },
      org_members: {
        data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.evidenceRefs.length).toBe(2);
  });

  it('fails when multi-member org has no access-change audit entries', async () => {
    const db = makeDb({
      org_audit_logs: {
        // Audit log exists but no access-change-like actions
        data: [
          {
            id: 'a1',
            action: 'evidence.uploaded',
            created_at: '2026-04-01',
            metadata: null,
          },
        ],
      },
      org_members: {
        data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
      },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'no_access_change_logs')).toBe(
      true,
    );
  });

  it('returns partial when some access entries lack before/after metadata', async () => {
    const db = makeDb({
      org_audit_logs: {
        data: [
          {
            id: 'a1',
            action: 'role.assigned',
            created_at: '2026-04-01',
            metadata: { before: 'm', after: 'a' },
          },
          {
            id: 'a2',
            action: 'role.removed',
            created_at: '2026-03-01',
            metadata: { previous: 'admin', new: null },
          },
          {
            id: 'a3',
            action: 'member.added',
            created_at: '2026-02-01',
            metadata: null,
          },
        ],
      },
      org_members: { data: [{ id: 'm1' }] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'sparse_change_metadata')).toBe(
      true,
    );
  });

  it('returns not_evaluated when multi-member org has no audit entries at all', async () => {
    const db = makeDb({
      org_audit_logs: { data: [] },
      org_members: { data: [{ id: 'm1' }, { id: 'm2' }] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_audit_entries');
  });
});
