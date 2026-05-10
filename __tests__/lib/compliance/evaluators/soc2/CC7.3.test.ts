/**
 * Tests for lib/compliance/evaluators/soc2/CC7.3.ts — high-severity remediation
 */

import { evaluate } from '@/lib/compliance/evaluators/soc2/CC7.3';
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

const NOW = new Date('2026-05-10T00:00:00Z');
const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('SOC2 CC7.3 — high-severity remediation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('passes when all SLA-eligible high-severity events were resolved within 30d', async () => {
    const events = [
      { id: 'e1', severity: 'high', created_at: daysAgo(60) },
      { id: 'e2', severity: 'critical', created_at: daysAgo(45) },
    ];
    const alerts = [
      {
        id: 'a1',
        event_id: 'e1',
        status: 'resolved',
        resolved_at: daysAgo(50), // 10d after event
      },
      {
        id: 'a2',
        event_id: 'e2',
        status: 'resolved',
        resolved_at: daysAgo(20), // 25d after event
      },
    ];
    const db = makeDb({
      security_events: { data: events },
      security_alerts: { data: alerts },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
  });

  it('fails when most eligible events breach the 30-day SLA', async () => {
    const events = [
      { id: 'e1', severity: 'high', created_at: daysAgo(120) },
      { id: 'e2', severity: 'high', created_at: daysAgo(100) },
      { id: 'e3', severity: 'critical', created_at: daysAgo(90) },
      { id: 'e4', severity: 'critical', created_at: daysAgo(80) },
    ];
    const alerts = [
      {
        id: 'a1',
        event_id: 'e4',
        status: 'resolved',
        resolved_at: daysAgo(70), // resolved within 10d
      },
    ];
    const db = makeDb({
      security_events: { data: events },
      security_alerts: { data: alerts },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('fail');
    expect(result.gaps[0].code).toBe('sla_majority_breach');
  });

  it('returns partial when 60-95% of eligible events were resolved on-time', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      id: `e${i}`,
      severity: 'high',
      created_at: daysAgo(60 + i),
    }));
    const alerts = [0, 1, 2, 3].map((i) => ({
      id: `a${i}`,
      event_id: `e${i}`,
      status: 'resolved',
      resolved_at: daysAgo(40 + i), // within 30d
    }));
    const db = makeDb({
      security_events: { data: events },
      security_alerts: { data: alerts },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps.some((g) => g.code === 'sla_breach')).toBe(true);
  });

  it('returns partial when no events have aged past the SLA window', async () => {
    const events = [
      { id: 'e1', severity: 'high', created_at: daysAgo(5) },
      { id: 'e2', severity: 'critical', created_at: daysAgo(10) },
    ];
    const db = makeDb({
      security_events: { data: events },
      security_alerts: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('partial');
    expect(result.gaps[0].code).toBe('sla_window_not_elapsed');
  });

  it('passes vacuously when no high/critical events exist', async () => {
    const db = makeDb({
      security_events: { data: [] },
      security_alerts: { data: [] },
    });
    const result = await evaluate(ctx(db));
    expect(result.status).toBe('pass');
    expect(result.confidence).toBe(0.7);
  });
});
