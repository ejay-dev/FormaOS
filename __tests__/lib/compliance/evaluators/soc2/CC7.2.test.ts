/**
 * Tests for lib/compliance/evaluators/soc2/CC7.2.ts — chain integrity
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC7.2';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';
import { computeEntryHash } from '@/lib/audit/hash-utils';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
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

function buildEntry(
  i: number,
  prevHash: string | null,
): FakeRow {
  const base = {
    id: `entry-${i}`,
    org_id: 'org-1',
    user_id: `user-${i}`,
    action: `action.${i}`,
    resource_type: 'thing',
    resource_id: `r-${i}`,
    details: { i },
    created_at: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
  };
  const hash = computeEntryHash({
    id: base.id,
    orgId: base.org_id,
    userId: base.user_id,
    action: base.action,
    resourceType: base.resource_type,
    resourceId: base.resource_id,
    details: base.details,
    createdAt: base.created_at,
    prevHash: prevHash ?? undefined,
  });
  return {
    ...base,
    entry_hash: hash,
    prev_hash: prevHash,
    sequence_number: i + 1,
  };
}

describe('SOC2 CC7.2 — chain integrity', () => {
  it('passes when chain is intact', async () => {
    const e1 = buildEntry(0, null);
    const e2 = buildEntry(1, e1.entry_hash as string);
    const e3 = buildEntry(2, e2.entry_hash as string);
    const db = makeDb({ audit_log: { data: [e1, e2, e3] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.evidenceRefs.length).toBe(3);
  });

  it('fails when an entry hash is tampered', async () => {
    const e1 = buildEntry(0, null);
    const e2 = buildEntry(1, e1.entry_hash as string);
    const e3 = buildEntry(2, e2.entry_hash as string);
    e2.entry_hash = 'deadbeef'; // tamper
    const db = makeDb({ audit_log: { data: [e1, e2, e3] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('chain_broken');
    expect(result.gaps[0].severity).toBe('critical');
  });

  it('returns partial-as-not_evaluated when no entries exist', async () => {
    const db = makeDb({ audit_log: { data: [] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_chain_entries');
  });

  it('returns not_evaluated when DB read errors out', async () => {
    const db = makeDb({
      audit_log: { data: null, error: { message: 'permission denied' } },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('audit_log_unavailable');
  });
});
