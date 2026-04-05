/**
 * Tests for lib/integrations/teams.ts
 *
 * Microsoft Teams integration: message sending, config CRUD, notifications, stats
 */

jest.mock('server-only', () => ({}));

// ── Supabase mock ────────────────────────────────────────────────────────────

function createBuilder(result = { data: null, error: null }) {
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
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
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

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((c: any) => c ?? {}),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  sendTeamsMessage,
  sendTeamsTaskNotification,
  sendTeamsCertificateNotification,
  sendTeamsComplianceAlert,
  sendTeamsRiskAnalysis,
  getTeamsConfig,
  saveTeamsConfig,
  testTeamsIntegration,
  disableTeamsIntegration,
  getTeamsStats,
} from '@/lib/integrations/teams';

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true });
});

describe('sendTeamsMessage', () => {
  it('sends an Adaptive Card to webhook URL', async () => {
    const result = await sendTeamsMessage('https://teams.webhook/hook', {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [{ type: 'TextBlock', text: 'Hello' }],
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://teams.webhook/hook',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('returns false on webhook failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await sendTeamsMessage('https://invalid.webhook', {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [],
    });

    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await sendTeamsMessage('https://teams.webhook/hook', {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [],
    });

    expect(result).toBe(false);
  });
});

describe('getTeamsConfig', () => {
  it('returns config when found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#general',
            enabled_events: ['task_created'],
            mention_users: [],
          },
        },
        error: null,
      }),
    );

    const config = await getTeamsConfig('org-1');
    expect(config).not.toBeNull();
    expect(config!.webhookUrl).toBe('https://hook.url');
    expect(config!.channelName).toBe('#general');
  });

  it('returns null when no config exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    const config = await getTeamsConfig('org-1');
    expect(config).toBeNull();
  });

  it('returns null on DB error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB error' } }),
    );
    const config = await getTeamsConfig('org-1');
    expect(config).toBeNull();
  });
});

describe('sendTeamsTaskNotification', () => {
  it('sends notification when event is enabled', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#tasks',
            enabled_events: ['task_created'],
          },
        },
        error: null,
      }),
    );

    await sendTeamsTaskNotification(
      'org-1',
      {
        id: 'task-1',
        title: 'Review Policy',
        status: 'open',
        priority: 'high',
      },
      'task_created',
    );

    expect(mockFetch).toHaveBeenCalled();
  });

  it('skips notification when event is not enabled', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#tasks',
            enabled_events: ['task_overdue'],
          },
        },
        error: null,
      }),
    );

    await sendTeamsTaskNotification(
      'org-1',
      {
        id: 'task-1',
        title: 'Review',
        status: 'open',
      },
      'task_created',
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('skips when config is null', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await sendTeamsTaskNotification(
      'org-1',
      {
        id: 'task-1',
        title: 'Review',
        status: 'open',
      },
      'task_created',
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('sendTeamsCertificateNotification', () => {
  it('sends notification for certificate expiring', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#certs',
            enabled_events: ['certificate_expiring'],
          },
        },
        error: null,
      }),
    );

    await sendTeamsCertificateNotification(
      'org-1',
      {
        id: 'cert-1',
        name: 'SOC 2 Type II',
        expiryDate: '2025-12-31',
        daysRemaining: 30,
      },
      'certificate_expiring',
    );

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('sendTeamsComplianceAlert', () => {
  it('sends alert when compliance_alert event is enabled', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#alerts',
            enabled_events: ['compliance_alert'],
          },
        },
        error: null,
      }),
    );

    await sendTeamsComplianceAlert('org-1', 'critical', {
      title: 'Score dropped',
      description: 'Compliance score dropped below threshold',
      category: 'SOC 2',
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('sendTeamsRiskAnalysis', () => {
  it('sends risk analysis results', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#risk',
            enabled_events: ['risk_analysis_complete'],
          },
        },
        error: null,
      }),
    );

    await sendTeamsRiskAnalysis('org-1', {
      overallRiskScore: 65,
      riskLevel: 'high',
      totalRisks: 12,
      topRisks: [{ title: 'Unencrypted data', severity: 'critical' }],
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('saveTeamsConfig', () => {
  it('updates existing config', async () => {
    // First call finds existing, second call updates
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx <= 2)
        return createBuilder({ data: { id: 'cfg-1' }, error: null });
      return createBuilder({ data: null, error: null });
    });

    await saveTeamsConfig('org-1', {
      webhookUrl: 'https://new.hook',
      channelName: '#new-channel',
      enabledEvents: ['task_created', 'task_completed'],
    });

    expect(getClient().from).toHaveBeenCalled();
  });

  it('inserts new config when none exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await saveTeamsConfig('org-1', {
      webhookUrl: 'https://hook.url',
      channelName: '#general',
      enabledEvents: ['task_created'],
    });

    expect(getClient().from).toHaveBeenCalled();
  });
});

describe('testTeamsIntegration', () => {
  it('sends test message and returns success', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          config: {
            webhook_url: 'https://hook.url',
            channel_name: '#test',
            enabled_events: [],
          },
        },
        error: null,
      }),
    );

    const result = await testTeamsIntegration('org-1');
    expect(result.success).toBe(true);
    expect(result.message).toContain('successfully');
  });

  it('returns failure when config not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const result = await testTeamsIntegration('org-1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not configured');
  });
});

describe('disableTeamsIntegration', () => {
  it('disables the integration', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await disableTeamsIntegration('org-1');
    expect(getClient().from).toHaveBeenCalledWith('integration_configs');
  });
});

describe('getTeamsStats', () => {
  it('returns stats with event counts', async () => {
    const events = [
      { event_type: 'task_created', status: 'sent' },
      { event_type: 'task_created', status: 'sent' },
      { event_type: 'task_overdue', status: 'failed' },
    ];

    getClient().from.mockImplementation(() =>
      createBuilder({ data: events, error: null }),
    );

    const stats = await getTeamsStats('org-1');
    expect(stats.totalSent).toBe(3);
    expect(stats.successRate).toBe(67);
    expect(stats.eventCounts.task_created).toBe(2);
  });

  it('returns zeros when no events', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    const stats = await getTeamsStats('org-1');
    expect(stats.totalSent).toBe(0);
    expect(stats.successRate).toBe(0);
  });
});
