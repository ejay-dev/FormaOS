import {
  trackUsageEvent,
  getUsageSummary,
  computeEngagementScore,
  getFeatureAdoption,
} from '@/lib/analytics/usage-tracker';

const mockQuery: any = {};
mockQuery.from = jest.fn().mockReturnValue(mockQuery);
mockQuery.select = jest.fn().mockReturnValue(mockQuery);
mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
mockQuery.in = jest.fn().mockReturnValue(mockQuery);
mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
mockQuery.lte = jest.fn().mockReturnValue(mockQuery);
mockQuery.order = jest.fn().mockReturnValue(mockQuery);
mockQuery.then = jest.fn((resolve: any) =>
  resolve({ data: [], error: null, count: 0 }),
);

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('trackUsageEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );
  });

  it('inserts event into org_usage_events', async () => {
    await trackUsageEvent('org-1', 'user-1', 'feature_use', 'tasks', {
      action: 'create',
    });

    expect(mockQuery.from).toHaveBeenCalledWith('org_usage_events');
    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        user_id: 'user-1',
        event_type: 'feature_use',
        event_name: 'tasks',
        metadata: { action: 'create' },
      }),
    );
  });

  it('handles null userId', async () => {
    await trackUsageEvent('org-1', null, 'system', 'cron', undefined);

    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        metadata: {},
      }),
    );
  });
});

describe('getUsageSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.select = jest.fn().mockReturnValue(mockQuery);
    mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
    mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
    mockQuery.lte = jest.fn().mockReturnValue(mockQuery);
    mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  });

  it('returns data for valid period', async () => {
    const mockData = [
      {
        period_start: '2025-01-01',
        period_end: '2025-01-07',
        event_count: 100,
      },
    ];
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: mockData, error: null }),
    );

    const result = await getUsageSummary(
      'org-1',
      'weekly',
      '2025-01-01',
      '2025-01-31',
    );

    expect(result).toEqual(mockData);
    expect(mockQuery.from).toHaveBeenCalledWith('org_usage_summaries');
    expect(mockQuery.eq).toHaveBeenCalledWith('period_type', 'weekly');
  });

  it('returns empty array when no data', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );

    const result = await getUsageSummary(
      'org-1',
      'daily',
      '2025-01-01',
      '2025-01-31',
    );
    expect(result).toEqual([]);
  });
});

describe('computeEngagementScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.select = jest.fn().mockReturnValue(mockQuery);
    mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
    mockQuery.in = jest.fn().mockReturnValue(mockQuery);
    mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
    // Default: no events
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null, count: 0 }),
    );
  });

  it('returns 0 for org with no events', async () => {
    const score = await computeEngagementScore('org-empty');
    expect(score).toBe(0);
  });

  it('returns a number between 0 and 100', async () => {
    // Simulate some usage data
    const events = [
      {
        user_id: 'u1',
        event_type: 'tasks',
        created_at: new Date().toISOString(),
      },
      {
        user_id: 'u2',
        event_type: 'evidence',
        created_at: new Date().toISOString(),
      },
    ];
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: events, error: null, count: events.length }),
    );

    const score = await computeEngagementScore('org-active');
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getFeatureAdoption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.from = jest.fn().mockReturnValue(mockQuery);
    mockQuery.select = jest.fn().mockReturnValue(mockQuery);
    mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
    mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
  });

  it('returns all features with adoption status', async () => {
    const events = [
      { event_type: 'tasks' },
      { event_type: 'tasks' },
      { event_type: 'evidence' },
    ];
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: events, error: null }),
    );

    const result = await getFeatureAdoption('org-1');

    expect(result.length).toBe(10); // ALL_FEATURES has 10 items
    const taskFeature = result.find((f) => f.feature === 'tasks');
    expect(taskFeature).toBeDefined();
    expect(taskFeature!.adopted).toBe(true);
    expect(taskFeature!.usageCount).toBe(2);

    const evidenceFeature = result.find((f) => f.feature === 'evidence');
    expect(evidenceFeature!.adopted).toBe(true);
    expect(evidenceFeature!.usageCount).toBe(1);

    const reportsFeature = result.find((f) => f.feature === 'reports');
    expect(reportsFeature!.adopted).toBe(false);
    expect(reportsFeature!.usageCount).toBe(0);
  });

  it('returns all features as not adopted when no events', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await getFeatureAdoption('org-empty');

    for (const feature of result) {
      expect(feature.adopted).toBe(false);
      expect(feature.usageCount).toBe(0);
    }
  });
});
