/**
 * Tests for lib/compliance/evaluators/soc2/CC7.1.ts — config-change detection
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC7.1';
import type { ControlEvaluatorContext } from '@/lib/compliance/evaluators/types';

type FakeRow = Record<string, unknown>;

function makeChain(result: { data: FakeRow[] | null; error: unknown }) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
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

function buildDailyEvents(daysBack: number, perDay = 2): FakeRow[] {
  const out: FakeRow[] = [];
  const now = Date.now();
  for (let d = 0; d < daysBack; d++) {
    for (let i = 0; i < perDay; i++) {
      out.push({
        id: `e-${d}-${i}`,
        created_at: new Date(
          now - d * 24 * 60 * 60 * 1000 - i * 3600 * 1000,
        ).toISOString(),
      });
    }
  }
  return out;
}

describe('SOC2 CC7.1 — config-change detection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-10T12:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes when ≥1 event/day average and no large gaps', async () => {
    const db = makeDb({
      security_events: { data: buildDailyEvents(90, 2) },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when event volume is critically low', async () => {
    const db = makeDb({ security_events: { data: buildDailyEvents(2, 1) } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps.some((g) => g.code === 'insufficient_monitoring')).toBe(
      true,
    );
  });

  it('returns partial when there is a multi-day silence gap', async () => {
    // 60 days of events with a 10-day gap somewhere; total ~120 events
    const events: FakeRow[] = [];
    const now = Date.now();
    for (let d = 0; d < 90; d++) {
      if (d >= 30 && d < 40) continue; // 10-day gap
      events.push({
        id: `e-${d}`,
        created_at: new Date(now - d * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    const db = makeDb({ security_events: { data: events } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(
      result.gaps.some((g) => g.code === 'monitoring_silence_gap'),
    ).toBe(true);
  });

  it('returns not_evaluated when there are no security_events at all', async () => {
    const db = makeDb({ security_events: { data: [] } });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('not_evaluated');
    expect(result.gaps[0].code).toBe('no_security_events');
  });
});
