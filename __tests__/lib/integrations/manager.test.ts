/**
 * Tests for lib/integrations/manager.ts
 * Covers: listAvailableIntegrations, getRequiredConfigKeys, connectIntegration, etc.
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));
jest.mock('@/lib/integrations/jira', () => ({
  createJiraIssue: jest.fn(),
  syncTaskStatusToJira: jest.fn(),
}));
jest.mock('@/lib/integrations/linear', () => ({
  createLinearIssue: jest.fn(),
  syncTaskStatusToLinear: jest.fn(),
}));
jest.mock('@/lib/integrations/slack', () => ({
  sendCertificateNotification: jest.fn(),
  sendComplianceAlert: jest.fn(),
  sendMemberNotification: jest.fn(),
  sendTaskNotification: jest.fn(),
}));
jest.mock('@/lib/integrations/teams', () => ({
  sendTeamsCertificateNotification: jest.fn(),
  sendTeamsComplianceAlert: jest.fn(),
  sendTeamsTaskNotification: jest.fn(),
}));
jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((c: any) => c ?? {}),
  encodeIntegrationConfig: jest.fn((c: any) => c ?? {}),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  listAvailableIntegrations,
  listConnectedIntegrations,
  getIntegrationStatus,
  connectIntegration,
} from '@/lib/integrations/manager';

beforeEach(() => jest.clearAllMocks());

describe('listAvailableIntegrations', () => {
  it('returns the catalog', () => {
    const items = listAvailableIntegrations();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.id === 'slack')).toBe(true);
    expect(items.some((i) => i.id === 'teams')).toBe(true);
    expect(items.some((i) => i.id === 'jira')).toBe(true);
    expect(items.some((i) => i.id === 'linear')).toBe(true);
    expect(items.some((i) => i.id === 'google_drive')).toBe(true);
    expect(items.some((i) => i.id === 'webhook_relay')).toBe(true);
  });
});

describe('listConnectedIntegrations', () => {
  it('returns connected integrations', async () => {
    const rows = [
      {
        id: 'ic1',
        organization_id: 'org-1',
        provider: 'slack',
        enabled: true,
        config: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];
    const builder = createBuilder({ data: rows, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await listConnectedIntegrations('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe('slack');
  });

  it('returns empty array when none connected', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await listConnectedIntegrations('org-1');
    expect(result).toEqual([]);
  });
});

describe('getIntegrationStatus', () => {
  it('returns status for all catalog items', async () => {
    const connected = [
      {
        id: 'ic1',
        organization_id: 'org-1',
        provider: 'slack',
        enabled: true,
        config: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];
    const syncLog = [{ provider: 'slack', synced_at: '2024-01-02' }];

    let callCount = 0;
    const builder1 = createBuilder({ data: connected, error: null });
    const builder2 = createBuilder({ data: syncLog, error: null });
    const client = {
      from: jest.fn(() => {
        callCount++;
        return callCount <= 1 ? builder1 : builder2;
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await getIntegrationStatus('org-1');
    expect(result.length).toBeGreaterThan(0);
    const slackStatus = result.find((s: any) => s.id === 'slack');
    expect(slackStatus?.connected).toBe(true);
    expect(slackStatus?.health).toBe('healthy');
  });
});

describe('connectIntegration', () => {
  it('throws for unsupported integration type', async () => {
    await expect(
      connectIntegration({
        orgId: 'org-1',
        type: 'unsupported' as any,
        config: {},
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Unsupported integration type');
  });

  it('throws for missing required config fields', async () => {
    await expect(
      connectIntegration({
        orgId: 'org-1',
        type: 'slack',
        config: {},
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Missing required config fields');
  });

  it('connects slack with valid config', async () => {
    const builder = createBuilder({ data: { id: 'ic1' }, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    await connectIntegration({
      orgId: 'org-1',
      type: 'slack',
      config: { webhook_url: 'https://hooks.slack.com/xxx' },
      actorUserId: 'user-1',
    });
    expect(createSupabaseAdminClient).toHaveBeenCalled();
  });

  it('validates jira required fields', async () => {
    await expect(
      connectIntegration({
        orgId: 'org-1',
        type: 'jira',
        config: { cloud_id: 'cid' }, // missing access_token, project_key, issue_type_id
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Missing required config fields');
  });

  it('validates linear required fields', async () => {
    await expect(
      connectIntegration({
        orgId: 'org-1',
        type: 'linear',
        config: { api_key: 'key' }, // missing team_id
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Missing required config fields');
  });

  it('validates teams required fields', async () => {
    await expect(
      connectIntegration({
        orgId: 'org-1',
        type: 'teams',
        config: { webhook_url: 'https://teams.webhook.office.com/xxx' }, // missing channel_name
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Missing required config fields');
  });
});
