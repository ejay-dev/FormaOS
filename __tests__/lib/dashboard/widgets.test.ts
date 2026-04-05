/**
 * Tests for Dashboard Widget Library
 */

function createBuilder(
  result: { data?: any; error?: any; count?: number } = {
    data: null,
    error: null,
  },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'in',
    'gte',
    'lte',
    'order',
    'limit',
    'maybeSingle',
    'single',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
function getClient() {
  return require('@/lib/supabase/server').__client;
}

jest.mock('@/lib/users/admin-profile-directory', () => ({
  getAdminProfileDirectoryEntries: jest.fn().mockResolvedValue([]),
}));

import {
  getRiskScoreWidgetData,
  getCertificateStatusWidgetData,
  getTaskProgressWidgetData,
  getComplianceScoreWidgetData,
  getTeamActivityWidgetData,
  getRecentAlertsWidgetData,
  getQuickStatsWidgetData,
  getTrendChartWidgetData,
  getWidgetData,
  saveWidgetConfig,
  getDashboardLayout,
  deleteWidget,
} from '@/lib/dashboard/widgets';

describe('getRiskScoreWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns default data when no analysis exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getRiskScoreWidgetData('org-1');
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.trend).toBe('stable');
  });

  it('returns analysis data when available', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          overall_risk_score: 75,
          risk_level: 'high',
          trends: { direction: 'increasing', changePercent: 10 },
          risks_by_severity: { critical: 2, high: 5, medium: 3, low: 1 },
        },
        error: null,
      }),
    );
    const result = await getRiskScoreWidgetData('org-1');
    expect(result.score).toBe(75);
    expect(result.level).toBe('high');
    expect(result.critical).toBe(2);
    expect(result.changePercent).toBe(10);
  });
});

describe('getCertificateStatusWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty data when no certificates', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getCertificateStatusWidgetData('org-1');
    expect(result.total).toBe(0);
  });

  it('categorizes certificates by expiry', async () => {
    const now = Date.now();
    const futureDate = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString();
    const soonDate = new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { id: '1', expiry_date: futureDate, status: 'active' },
          { id: '2', expiry_date: soonDate, status: 'active' },
          { id: '3', expiry_date: pastDate, status: 'expired' },
        ],
        error: null,
      }),
    );

    const result = await getCertificateStatusWidgetData('org-1');
    expect(result.total).toBe(3);
  });
});

describe('getWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
  });

  it('routes to risk_score widget', async () => {
    const result = await getWidgetData('w1', 'risk_score', 'org-1');
    expect(result).toHaveProperty('data');
    expect(result.type).toBe('risk_score');
  });

  it('routes to certificate_status widget', async () => {
    const result = await getWidgetData('w1', 'certificate_status', 'org-1');
    expect(result.type).toBe('certificate_status');
  });

  it('routes to task_progress widget', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getWidgetData('w1', 'task_progress', 'org-1');
    expect(result.type).toBe('task_progress');
  });

  it('routes to recent_alerts widget', async () => {
    const result = await getWidgetData('w1', 'recent_alerts', 'org-1');
    expect(result.type).toBe('recent_alerts');
  });
});

describe('saveWidgetConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('upserts widget config', async () => {
    const config = {
      id: 'w1',
      organizationId: 'org-1',
      type: 'risk_score' as const,
      title: 'Risk',
      size: 'medium' as const,
      position: { x: 0, y: 0 },
      refreshInterval: 60,
      settings: {},
      enabled: true,
    };

    await saveWidgetConfig(config);
    expect(getClient().from).toHaveBeenCalledWith('dashboard_layouts');
  });
});

describe('getDashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns layout array', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            widget_id: 'w1',
            widget_type: 'risk_score',
            position: { x: 0, y: 0 },
            organization_id: 'org-1',
            title: 'R',
            size: 'medium',
            refresh_interval: 60,
            settings: {},
            enabled: true,
          },
        ],
        error: null,
      }),
    );
    const result = await getDashboardLayout('org-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });
});

describe('deleteWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('deletes widget by id', async () => {
    await deleteWidget('w1');
    expect(getClient().from).toHaveBeenCalledWith('dashboard_layouts');
  });
});

// ── Additional coverage ──

describe('getTaskProgressWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty data when no tasks', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getTaskProgressWidgetData('org-1');
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.completionRate).toBe(0);
  });

  it('categorizes tasks by status', async () => {
    const now = Date.now();
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: '1',
            status: 'completed',
            completed_at: new Date(now).toISOString(),
            priority: 'high',
          },
          {
            id: '2',
            status: 'in_progress',
            due_date: new Date(now + 86400000).toISOString(),
          },
          {
            id: '3',
            status: 'not_started',
            due_date: new Date(now - 86400000).toISOString(),
          },
        ],
        error: null,
      }),
    );
    const result = await getTaskProgressWidgetData('org-1');
    expect(result.total).toBe(3);
    expect(result.completed).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.notStarted).toBe(1);
    expect(result.overdue).toBe(1);
    expect(result.completionRate).toBe(33);
  });
});

describe('getComplianceScoreWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty data when no scans', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getComplianceScoreWidgetData('org-1');
    expect(result.score).toBe(0);
    expect(result.framework).toBe('none');
  });

  it('returns latest scan data with trend', async () => {
    let callNum = 0;
    getClient().from.mockImplementation(() => {
      callNum++;
      if (callNum === 1) {
        return createBuilder({
          data: [
            {
              compliance_score: 85,
              framework: 'soc2',
              compliant: 40,
              non_compliant: 5,
              partial: 3,
              completed_at: '2024-06-01',
            },
          ],
          error: null,
        });
      }
      return createBuilder({
        data: [{ compliance_score: 85 }, { compliance_score: 70 }],
        error: null,
      });
    });
    const result = await getComplianceScoreWidgetData('org-1', 'soc2');
    expect(result.score).toBe(85);
    expect(result.framework).toBe('soc2');
    expect(result.trend).toBe('improving');
  });
});

describe('getTeamActivityWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty data when no activities', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getTeamActivityWidgetData('org-1');
    expect(result.totalActivities).toBe(0);
    expect(result.activeUsers).toBe(0);
  });

  it('counts activities by user', async () => {
    const today = new Date().toISOString();
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { user_id: 'u1', action: 'create', created_at: today },
          { user_id: 'u1', action: 'update', created_at: today },
          { user_id: 'u2', action: 'create', created_at: today },
        ],
        error: null,
      }),
    );
    const result = await getTeamActivityWidgetData('org-1');
    expect(result.totalActivities).toBe(3);
    expect(result.activeUsers).toBe(2);
    expect(result.activityByDay).toHaveLength(30);
  });
});

describe('getTrendChartWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
  });

  it('returns risk trend data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [{ overall_risk_score: 50, created_at: '2024-06-01T00:00:00Z' }],
        error: null,
      }),
    );
    const result = await getTrendChartWidgetData('org-1', 'risk');
    expect(result.metric).toBe('risk');
    expect(result.dataPoints).toHaveLength(1);
    expect(result.dataPoints[0].value).toBe(50);
  });

  it('returns compliance trend data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [{ compliance_score: 80, completed_at: '2024-06-01T00:00:00Z' }],
        error: null,
      }),
    );
    const result = await getTrendChartWidgetData('org-1', 'compliance');
    expect(result.metric).toBe('compliance');
    expect(result.dataPoints).toHaveLength(1);
  });

  it('returns tasks trend data', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getTrendChartWidgetData('org-1', 'tasks', 7);
    expect(result.metric).toBe('tasks');
    expect(result.dataPoints).toHaveLength(7);
  });
});

describe('getRecentAlertsWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty when no notifications', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const result = await getRecentAlertsWidgetData('org-1');
    expect(result.alerts).toEqual([]);
    expect(result.unreadCount).toBe(0);
  });

  it('maps notifications to alert format', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: 'n1',
            type: 'risk_alert',
            title: 'High Risk',
            message: 'Score high',
            metadata: { severity: 'high' },
            created_at: '2024-01-01',
            read: false,
          },
          {
            id: 'n2',
            type: 'compliance_alert',
            title: 'Scan Done',
            message: 'OK',
            metadata: {},
            created_at: '2024-01-02',
            read: true,
          },
        ],
        error: null,
      }),
    );
    const result = await getRecentAlertsWidgetData('org-1');
    expect(result.alerts).toHaveLength(2);
    expect(result.unreadCount).toBe(1);
    expect(result.alerts[0].severity).toBe('high');
  });
});

describe('getQuickStatsWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
  });

  it('aggregates data from all widget types', async () => {
    const result = await getQuickStatsWidgetData('org-1');
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('complianceScore');
    expect(result).toHaveProperty('taskCompletionRate');
    expect(result).toHaveProperty('lastUpdated');
  });
});

describe('getWidgetData - additional routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
  });

  it('routes to compliance_score widget', async () => {
    const result = await getWidgetData('w1', 'compliance_score', 'org-1', {
      framework: 'soc2',
    });
    expect(result.type).toBe('compliance_score');
  });

  it('routes to team_activity widget', async () => {
    const result = await getWidgetData('w1', 'team_activity', 'org-1');
    expect(result.type).toBe('team_activity');
  });

  it('routes to trend_chart widget', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: [], error: null }),
    );
    const result = await getWidgetData('w1', 'trend_chart', 'org-1', {
      metric: 'risk',
      days: 7,
    });
    expect(result.type).toBe('trend_chart');
  });

  it('routes to quick_stats widget', async () => {
    const result = await getWidgetData('w1', 'quick_stats', 'org-1');
    expect(result.type).toBe('quick_stats');
  });

  it('returns empty data for unknown type', async () => {
    const result = await getWidgetData('w1', 'unknown' as any, 'org-1');
    expect(result.data).toEqual({});
  });
});

describe('getDashboardLayout - errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await getDashboardLayout('org-1');
    expect(result).toEqual([]);
  });
});
