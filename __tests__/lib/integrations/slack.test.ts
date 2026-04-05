/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Supabase builder helper                                           */
/* ------------------------------------------------------------------ */
function createBuilder(
  result: { data?: any; error?: any } = { data: null, error: null },
) {
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

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
jest.mock('server-only', () => ({}));

jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((config: any) => config),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
  };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/server').__client;
}

import {
  sendSlackMessage,
  sendTaskNotification,
  sendCertificateNotification,
  sendComplianceAlert,
  sendMemberNotification,
  testSlackIntegration,
  getSlackConfig,
  saveSlackConfig,
  disableSlackIntegration,
  getSlackStats,
} from '@/lib/integrations/slack';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function mockSlackConfig(overrides: Record<string, any> = {}) {
  getClient().from.mockImplementation((table: string) => {
    if (table === 'integration_configs')
      return createBuilder({
        data: {
          organization_id: 'org-1',
          provider: 'slack',
          enabled: true,
          webhook_url: 'https://hooks.slack.com/test',
          config: {
            webhook_url: 'https://hooks.slack.com/test',
            channel: '#compliance',
            events: [
              'task_created',
              'task_completed',
              'task_overdue',
              'certificate_expiring',
              'certificate_expired',
              'member_added',
              'compliance_alert',
            ],
          },
          ...overrides,
        },
      });
    return createBuilder();
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('slack integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, statusText: 'OK' });
  });

  /* ---------- sendSlackMessage ---------- */
  describe('sendSlackMessage', () => {
    it('sends message successfully', async () => {
      mockSlackConfig();
      const result = await sendSlackMessage('org-1', { text: 'Hello Slack!' });
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns error when config not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'not found' } }),
      );
      const result = await sendSlackMessage('org-1', { text: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('returns error when integration disabled', async () => {
      mockSlackConfig({ enabled: false });
      const result = await sendSlackMessage('org-1', { text: 'test' });
      expect(result.success).toBe(false);
    });

    it('returns error when fetch fails', async () => {
      mockSlackConfig();
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Bad Request' });
      const result = await sendSlackMessage('org-1', { text: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error');
    });
  });

  /* ---------- sendTaskNotification ---------- */
  describe('sendTaskNotification', () => {
    it('sends created notification', async () => {
      mockSlackConfig();
      await sendTaskNotification(
        'org-1',
        { id: 't1', title: 'Review SOC2', status: 'pending', priority: 'high' },
        'created',
      );
      expect(mockFetch).toHaveBeenCalled();
    });

    it('sends overdue notification with due date', async () => {
      mockSlackConfig();
      await sendTaskNotification(
        'org-1',
        { id: 't1', title: 'Review', status: 'pending', dueDate: '2025-01-01' },
        'overdue',
      );
      expect(mockFetch).toHaveBeenCalled();
    });

    it('skips when event not in config', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'integration_configs')
          return createBuilder({
            data: {
              organization_id: 'org-1',
              enabled: true,
              config: {
                webhook_url: 'https://hooks.slack.com/test',
                events: [],
              },
            },
          });
        return createBuilder();
      });
      await sendTaskNotification(
        'org-1',
        { id: 't1', title: 'T', status: 'p' },
        'created',
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  /* ---------- sendCertificateNotification ---------- */
  describe('sendCertificateNotification', () => {
    it('sends expiring notification', async () => {
      mockSlackConfig();
      await sendCertificateNotification(
        'org-1',
        {
          id: 'c1',
          name: 'ISO 27001',
          expiryDate: '2025-07-01',
          status: 'active',
          daysUntilExpiry: 15,
        },
        'expiring',
      );
      expect(mockFetch).toHaveBeenCalled();
    });

    it('sends expired notification', async () => {
      mockSlackConfig();
      await sendCertificateNotification(
        'org-1',
        {
          id: 'c1',
          name: 'PCI-DSS',
          expiryDate: '2025-01-01',
          status: 'expired',
          daysUntilExpiry: 0,
        },
        'expired',
      );
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  /* ---------- sendComplianceAlert ---------- */
  describe('sendComplianceAlert', () => {
    it('sends alert with all severity levels', async () => {
      for (const severity of ['low', 'medium', 'high', 'critical'] as const) {
        jest.clearAllMocks();
        mockSlackConfig();
        mockFetch.mockResolvedValue({ ok: true });
        await sendComplianceAlert('org-1', {
          title: 'Test Alert',
          description: 'Something happened',
          severity,
        });
        expect(mockFetch).toHaveBeenCalled();
      }
    });

    it('includes action required when provided', async () => {
      mockSlackConfig();
      await sendComplianceAlert('org-1', {
        title: 'Alert',
        description: 'Desc',
        severity: 'high',
        actionRequired: 'Fix ASAP',
      });
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.blocks.length).toBeGreaterThan(2);
    });
  });

  /* ---------- sendMemberNotification ---------- */
  describe('sendMemberNotification', () => {
    it('sends added notification', async () => {
      mockSlackConfig();
      await sendMemberNotification(
        'org-1',
        { name: 'Alice', email: 'alice@test.com', role: 'admin' },
        'added',
      );
      expect(mockFetch).toHaveBeenCalled();
    });

    it('sends removed notification', async () => {
      mockSlackConfig();
      await sendMemberNotification(
        'org-1',
        { name: 'Bob', email: 'bob@test.com', role: 'member' },
        'removed',
      );
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  /* ---------- testSlackIntegration ---------- */
  describe('testSlackIntegration', () => {
    it('returns success on valid webhook', async () => {
      const result = await testSlackIntegration('https://hooks.slack.com/test');
      expect(result.success).toBe(true);
    });

    it('returns error on invalid webhook', async () => {
      mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });
      const result = await testSlackIntegration('https://invalid.url');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error');
    });

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));
      const result = await testSlackIntegration('https://hooks.slack.com/test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('network error');
    });
  });

  /* ---------- getSlackConfig ---------- */
  describe('getSlackConfig', () => {
    it('returns parsed config', async () => {
      mockSlackConfig();
      const config = await getSlackConfig('org-1');
      expect(config).not.toBeNull();
      expect(config!.webhookUrl).toBe('https://hooks.slack.com/test');
      expect(config!.channel).toBe('#compliance');
      expect(config!.enabled).toBe(true);
    });

    it('returns null when not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'not found' } }),
      );
      const config = await getSlackConfig('org-1');
      expect(config).toBeNull();
    });
  });

  /* ---------- saveSlackConfig ---------- */
  describe('saveSlackConfig', () => {
    it('upserts config', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      await expect(
        saveSlackConfig({
          organizationId: 'org-1',
          webhookUrl: 'https://hooks.slack.com/new',
          channel: '#alerts',
          enabled: true,
          events: ['task_created'],
        }),
      ).resolves.not.toThrow();
    });
  });

  /* ---------- disableSlackIntegration ---------- */
  describe('disableSlackIntegration', () => {
    it('updates enabled to false', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      await expect(disableSlackIntegration('org-1')).resolves.not.toThrow();
    });
  });

  /* ---------- getSlackStats ---------- */
  describe('getSlackStats', () => {
    it('returns stats from integration events', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: [
            { event_type: 'message_sent', created_at: '2025-01-15T10:00:00Z' },
            { event_type: 'message_sent', created_at: '2025-01-14T10:00:00Z' },
            { event_type: 'alert_sent', created_at: '2025-01-13T10:00:00Z' },
          ],
        }),
      );
      const stats = await getSlackStats('org-1');
      expect(stats.totalMessages).toBe(3);
      expect(stats.messagesByType.message_sent).toBe(2);
      expect(stats.lastMessageAt).toBe('2025-01-15T10:00:00Z');
    });

    it('returns zeros on error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      const stats = await getSlackStats('org-1');
      expect(stats.totalMessages).toBe(0);
    });
  });
});
