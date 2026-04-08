/**
 * Tests for lib/reports/widget-data.ts
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockDb: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/analytics/snapshot-engine', () => ({
  getSnapshots: jest.fn(async () => []),
  getTrend: jest.fn(async () => [
    { date: '2024-01', value: 80 },
    { date: '2024-02', value: 85 },
  ]),
}));

import { resolveWidgetData } from '@/lib/reports/widget-data';
import { getSnapshots, getTrend } from '@/lib/analytics/snapshot-engine';

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.from = jest.fn(() => createBuilder());
});

const baseConfig = {
  dateRange: { from: '2024-01-01', to: '2024-06-01' },
};

describe('resolveWidgetData', () => {
  it('returns empty object for unknown widget type', async () => {
    const result = await resolveWidgetData(mockDb as any, 'org-1', {
      ...baseConfig,
      type: 'nonexistent' as any,
    });
    expect(result).toEqual({});
  });

  describe('score_trend', () => {
    it('returns line_chart with trend data', async () => {
      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'score_trend',
      });
      expect(result.type).toBe('line_chart');
      expect(result.label).toBe('Compliance Score');
      expect(getTrend).toHaveBeenCalledWith(
        mockDb,
        'org-1',
        'compliance_score',
        baseConfig.dateRange,
      );
    });
  });

  describe('framework_comparison', () => {
    it('returns bar_chart with framework scores', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            { framework_id: 'f1', name: 'SOC 2', score: 85 },
            { framework_id: 'f2', name: 'ISO 27001', score: 72 },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'framework_comparison',
      });

      expect(result.type).toBe('bar_chart');
      expect(result.data).toEqual([
        { label: 'SOC 2', value: 85 },
        { label: 'ISO 27001', value: 72 },
      ]);
    });

    it('handles null score', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [{ framework_id: 'f1', name: 'GDPR', score: null }],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'framework_comparison',
      });

      expect((result.data as any)[0].value).toBe(0);
    });

    it('handles null data', async () => {
      mockDb.from = jest.fn(() => createBuilder({ data: null, error: null }));

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'framework_comparison',
      });

      expect(result.data).toEqual([]);
    });
  });

  describe('gap_table', () => {
    it('returns table with gap controls', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            {
              id: 'c1',
              control_id: 'CC-1',
              title: 'Encryption',
              status: 'not_met',
              framework_id: 'f1',
            },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'gap_table',
      });

      expect(result.type).toBe('table');
      expect(result.columns).toContain('Control ID');
      expect((result.rows as any[])[0]).toEqual([
        'CC-1',
        'Encryption',
        'not_met',
        'f1',
      ]);
    });

    it('handles null data', async () => {
      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'gap_table',
      });

      expect(result.rows).toEqual([]);
    });
  });

  describe('task_status', () => {
    it('returns pie_chart with task status counts', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            { status: 'completed' },
            { status: 'completed' },
            { status: 'in_progress' },
            { status: 'pending' },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'task_status',
      });

      expect(result.type).toBe('pie_chart');
      const data = result.data as { label: string; value: number }[];
      expect(data.find((d) => d.label === 'completed')?.value).toBe(2);
      expect(data.find((d) => d.label === 'in_progress')?.value).toBe(1);
    });

    it('handles empty tasks', async () => {
      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'task_status',
      });

      expect(result.data).toEqual([]);
    });
  });

  describe('evidence_freshness', () => {
    it('categorizes evidence into buckets', async () => {
      const now = Date.now();
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            {
              id: 'e1',
              title: 'Recent',
              created_at: new Date(now - 5 * 86400000).toISOString(),
              updated_at: new Date(now - 5 * 86400000).toISOString(),
            },
            {
              id: 'e2',
              title: 'Aging',
              created_at: new Date(now - 60 * 86400000).toISOString(),
              updated_at: new Date(now - 60 * 86400000).toISOString(),
            },
            {
              id: 'e3',
              title: 'Stale',
              created_at: new Date(now - 120 * 86400000).toISOString(),
              updated_at: new Date(now - 120 * 86400000).toISOString(),
            },
            {
              id: 'e4',
              title: 'Expired',
              created_at: new Date(now - 200 * 86400000).toISOString(),
              updated_at: new Date(now - 200 * 86400000).toISOString(),
            },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'evidence_freshness',
      });

      expect(result.type).toBe('bar_chart');
      const data = result.data as { label: string; value: number }[];
      expect(data.find((d) => d.label === 'fresh')?.value).toBe(1);
      expect(data.find((d) => d.label === 'aging')?.value).toBe(1);
      expect(data.find((d) => d.label === 'stale')?.value).toBe(1);
      expect(data.find((d) => d.label === 'expired')?.value).toBe(1);
    });

    it('uses updated_at for age, falls back to created_at', async () => {
      const now = Date.now();
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            {
              id: 'e1',
              title: 'No update',
              created_at: new Date(now - 5 * 86400000).toISOString(),
              updated_at: null,
            },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'evidence_freshness',
      });

      const data = result.data as { label: string; value: number }[];
      expect(data.find((d) => d.label === 'fresh')?.value).toBe(1);
    });
  });

  describe('member_activity', () => {
    it('returns top 10 actors by activity count', async () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        actor_id: `user-${i % 12}`,
        action: 'update',
      }));

      mockDb.from = jest.fn(() =>
        createBuilder({ data: entries, error: null }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'member_activity',
      });

      expect(result.type).toBe('bar_chart');
      expect((result.data as any[]).length).toBeLessThanOrEqual(10);
    });

    it('skips entries with null actor_id', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            { actor_id: null, action: 'update' },
            { actor_id: 'user-1', action: 'update' },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'member_activity',
      });

      expect((result.data as any[]).length).toBe(1);
    });
  });

  describe('incident_trend', () => {
    it('returns line_chart grouped by month', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            { severity: 'high', created_at: '2024-01-15T00:00:00Z' },
            { severity: 'medium', created_at: '2024-01-20T00:00:00Z' },
            { severity: 'low', created_at: '2024-02-05T00:00:00Z' },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'incident_trend',
      });

      expect(result.type).toBe('line_chart');
      const data = result.data as { date: string; value: number }[];
      expect(data.find((d) => d.date === '2024-01')?.value).toBe(2);
      expect(data.find((d) => d.date === '2024-02')?.value).toBe(1);
    });
  });

  describe('certificate_timeline', () => {
    it('returns timeline data', async () => {
      mockDb.from = jest.fn(() =>
        createBuilder({
          data: [
            {
              id: 'c1',
              name: 'SOC 2',
              issued_date: '2024-01-01',
              expiry_date: '2025-01-01',
              status: 'active',
            },
          ],
          error: null,
        }),
      );

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'certificate_timeline',
      });

      expect(result.type).toBe('timeline');
      expect((result.data as any[])[0].label).toBe('SOC 2');
    });
  });

  describe('custom_kpi', () => {
    it('returns kpi with trend up', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { compliance_score: 70 } },
        { metrics: { compliance_score: 85 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
      });

      expect(result.type).toBe('kpi');
      expect(result.value).toBe(85);
      expect(result.previousValue).toBe(70);
      expect(result.trend).toBe('up');
      expect(result.change).toBe(15);
    });

    it('returns kpi with trend down', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { compliance_score: 90 } },
        { metrics: { compliance_score: 60 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
      });

      expect(result.trend).toBe('down');
    });

    it('returns flat trend when equal', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { compliance_score: 80 } },
        { metrics: { compliance_score: 80 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
      });

      expect(result.trend).toBe('flat');
    });

    it('handles empty snapshots', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
      });

      expect(result.value).toBe(0);
      expect(result.previousValue).toBe(0);
    });

    it('uses custom metric from filters', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { risk_index: 42 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
        filters: { metric: 'risk_index' },
      });

      expect(result.value).toBe(42);
      expect(result.label).toBe('risk index');
    });

    it('single snapshot uses same value for current and previous', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { compliance_score: 75 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'custom_kpi',
      });

      expect(result.value).toBe(75);
      expect(result.previousValue).toBe(75);
      expect(result.change).toBe(0);
    });
  });

  describe('compliance_snapshot', () => {
    it('returns comparison with current and comparison metrics', async () => {
      (getSnapshots as jest.Mock)
        .mockResolvedValueOnce([{ metrics: { score: 85 } }])
        .mockResolvedValueOnce([{ metrics: { score: 72 } }]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'compliance_snapshot',
        comparisonPeriod: { from: '2023-06-01', to: '2023-12-01' },
      });

      expect(result.type).toBe('comparison');
      expect(result.current).toEqual({ score: 85 });
      expect(result.comparison).toEqual({ score: 72 });
    });

    it('returns empty comparison when no comparison period', async () => {
      (getSnapshots as jest.Mock).mockResolvedValueOnce([
        { metrics: { score: 85 } },
      ]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'compliance_snapshot',
      });

      expect(result.comparison).toEqual({});
    });

    it('handles empty snapshots', async () => {
      (getSnapshots as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await resolveWidgetData(mockDb as any, 'org-1', {
        ...baseConfig,
        type: 'compliance_snapshot',
        comparisonPeriod: { from: '2023-01-01', to: '2023-06-01' },
      });

      expect(result.current).toEqual({});
      expect(result.comparison).toEqual({});
    });
  });
});
