/**
 * Branch-coverage tests for lib/analytics/snapshot-engine.ts
 * Targets uncovered branches in captureSnapshot, getSnapshots, getTrend,
 * compareSnapshots, getMetricSummary, and internal metric gatherers
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null, count: 0 }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
    'head',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

import {
  captureSnapshot,
  getSnapshots,
  getTrend,
  compareSnapshots,
  getMetricSummary,
} from '@/lib/analytics/snapshot-engine';

describe('captureSnapshot', () => {
  it('captures and upserts a snapshot', async () => {
    let callNum = 0;
    const db = {
      from: jest.fn(() => {
        callNum++;
        // 1: org_controls, 2: org_evidence, 3: org_tasks, 4: org_incidents, 5: org_members, 6: upsert
        if (callNum === 1)
          return createBuilder({
            data: [
              { status: 'satisfied' },
              { status: 'not_met' },
              { status: 'in_progress' },
            ],
            error: null,
          });
        if (callNum === 2)
          return createBuilder({
            data: [{ id: '1', created_at: new Date().toISOString() }],
            error: null,
          });
        if (callNum === 3)
          return createBuilder({
            data: [
              { status: 'completed', due_date: null },
              { status: 'open', due_date: '2020-01-01' },
            ],
            error: null,
          });
        if (callNum === 4)
          return createBuilder({ data: null, error: null, count: 3 });
        if (callNum === 5)
          return createBuilder({
            data: [{ status: 'active' }, { status: 'invited' }],
            error: null,
          });
        return createBuilder({
          data: { id: 'snap1', metrics: {} },
          error: null,
        });
      }),
    } as any;
    const result = await captureSnapshot(db, 'org1');
    expect(result.id).toBe('snap1');
  });

  it('throws on upsert error', async () => {
    let callNum = 0;
    const db = {
      from: jest.fn(() => {
        callNum++;
        if (callNum <= 5)
          return createBuilder({ data: [], error: null, count: 0 });
        return createBuilder({ data: null, error: { message: 'upsert fail' } });
      }),
    } as any;
    await expect(captureSnapshot(db, 'org1')).rejects.toThrow('upsert fail');
  });

  it('handles empty metrics data', async () => {
    let callNum = 0;
    const db = {
      from: jest.fn(() => {
        callNum++;
        if (callNum <= 5)
          return createBuilder({ data: null, error: null, count: null });
        return createBuilder({ data: { id: 'snap2' }, error: null });
      }),
    } as any;
    const result = await captureSnapshot(db, 'org1');
    expect(result).toBeDefined();
  });
});

describe('getSnapshots', () => {
  it('returns snapshots', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({
          data: [{ snapshot_date: '2024-01-01', metrics: { score: 80 } }],
          error: null,
        }),
      ),
    } as any;
    const result = await getSnapshots(db, 'org1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.length).toBe(1);
  });

  it('returns empty when no data', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    } as any;
    const result = await getSnapshots(db, 'org1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result).toEqual([]);
  });
});

describe('getTrend', () => {
  it('maps metric values', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({
          data: [
            { snapshot_date: '2024-01-01', metrics: { score: 80 } },
            { snapshot_date: '2024-01-02', metrics: { score: 85 } },
          ],
          error: null,
        }),
      ),
    } as any;
    const result = await getTrend(db, 'org1', 'score', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result[0].value).toBe(80);
    expect(result[1].value).toBe(85);
  });

  it('uses 0 for missing metric keys', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({
          data: [{ snapshot_date: '2024-01-01', metrics: {} }],
          error: null,
        }),
      ),
    } as any;
    const result = await getTrend(db, 'org1', 'missing', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result[0].value).toBe(0);
  });
});

describe('compareSnapshots', () => {
  it('calculates deltas between two dates', async () => {
    let callNum = 0;
    const db = {
      from: jest.fn(() => {
        callNum++;
        if (callNum === 1)
          return createBuilder({
            data: { metrics: { score: 80, tasks: 10 } },
            error: null,
          });
        return createBuilder({
          data: { metrics: { score: 90, new_metric: 5 } },
          error: null,
        });
      }),
    } as any;
    const result = await compareSnapshots(
      db,
      'org1',
      '2024-01-01',
      '2024-01-15',
    );
    expect(result.deltas.score.change).toBe(10);
    expect(result.deltas.tasks.after).toBe(0);
    expect(result.deltas.new_metric.before).toBe(0);
  });

  it('handles missing snapshot data', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    } as any;
    const result = await compareSnapshots(
      db,
      'org1',
      '2024-01-01',
      '2024-01-15',
    );
    expect(Object.keys(result.deltas).length).toBe(0);
  });
});

describe('getMetricSummary', () => {
  it('calculates min/max/avg/current/change', async () => {
    const db = {
      from: jest.fn(() =>
        createBuilder({
          data: [
            { snapshot_date: '2024-01-01', metrics: { score: 70 } },
            { snapshot_date: '2024-01-02', metrics: { score: 80 } },
            { snapshot_date: '2024-01-03', metrics: { score: 90 } },
          ],
          error: null,
        }),
      ),
    } as any;
    const result = await getMetricSummary(db, 'org1', 'score', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.min).toBe(70);
    expect(result.max).toBe(90);
    expect(result.avg).toBe(80);
    expect(result.current).toBe(90);
    expect(result.change).toBe(20);
  });

  it('returns zeros when no trend data', async () => {
    const db = {
      from: jest.fn(() => createBuilder({ data: [], error: null })),
    } as any;
    const result = await getMetricSummary(db, 'org1', 'score', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.min).toBe(0);
    expect(result.current).toBe(0);
  });
});
