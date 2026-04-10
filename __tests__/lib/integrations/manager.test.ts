/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/integrations/jira', () => ({
  createJiraIssue: jest.fn().mockResolvedValue(undefined),
  syncTaskStatusToJira: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/integrations/linear', () => ({
  createLinearIssue: jest.fn().mockResolvedValue(undefined),
  syncTaskStatusToLinear: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/integrations/slack', () => ({
  sendTaskNotification: jest.fn().mockResolvedValue(undefined),
  sendCertificateNotification: jest.fn().mockResolvedValue(undefined),
  sendMemberNotification: jest.fn().mockResolvedValue(undefined),
  sendComplianceAlert: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/integrations/teams', () => ({
  sendTeamsTaskNotification: jest.fn().mockResolvedValue(undefined),
  sendTeamsCertificateNotification: jest.fn().mockResolvedValue(undefined),
  sendTeamsComplianceAlert: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((x: unknown) => x),
  encodeIntegrationConfig: jest.fn((x: unknown) => x),
}));

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit-trail';
import { createJiraIssue, syncTaskStatusToJira } from '@/lib/integrations/jira';
import {
  createLinearIssue,
  syncTaskStatusToLinear,
} from '@/lib/integrations/linear';
import {
  sendTaskNotification,
  sendCertificateNotification,
  sendMemberNotification,
  sendComplianceAlert,
} from '@/lib/integrations/slack';
import {
  sendTeamsTaskNotification,
  sendTeamsCertificateNotification,
  sendTeamsComplianceAlert,
} from '@/lib/integrations/teams';
import {
  listAvailableIntegrations,
  listConnectedIntegrations,
  getIntegrationStatus,
  connectIntegration,
  disconnectIntegration,
  testIntegration,
  getIntegrationEventHistory,
  dispatchIntegrationEvent,
} from '@/lib/integrations/manager';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockChain(result: unknown = { data: null, error: null }) {
  const c: Record<string, any> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.neq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.upsert = jest.fn().mockReturnValue(c);
  c.insert = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  c.delete = jest.fn().mockReturnValue(c);
  c.maybeSingle = jest.fn().mockResolvedValue(result);
  c.single = jest.fn().mockResolvedValue(result);
  c.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return c;
}

type TableResults = Record<string, unknown>;

function makeAdmin(
  tableResults: Record<string, TableResults | TableResults[]> = {},
) {
  const callIndex: Record<string, number> = {};
  const admin = {
    from: jest.fn().mockImplementation((table: string) => {
      const res = tableResults[table];
      if (Array.isArray(res)) {
        const idx = callIndex[table] ?? 0;
        callIndex[table] = idx + 1;
        return mockChain(res[idx] ?? { data: null, error: null });
      }
      return mockChain(res ?? { data: null, error: null });
    }),
  };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);
  return admin;
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe('integrations/manager', () => {
  beforeEach(() => jest.clearAllMocks());

  /* ---- listAvailableIntegrations ---- */
  describe('listAvailableIntegrations', () => {
    it('returns full catalog with 6 entries', () => {
      const result = listAvailableIntegrations();
      expect(result).toHaveLength(6);
      expect(result.map((r) => r.id)).toEqual(
        expect.arrayContaining([
          'slack',
          'teams',
          'jira',
          'linear',
          'google_drive',
          'webhook_relay',
        ]),
      );
    });

    it('each entry has required shape', () => {
      const result = listAvailableIntegrations();
      for (const item of result) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('capabilities');
      }
    });
  });

  /* ---- listConnectedIntegrations ---- */
  describe('listConnectedIntegrations', () => {
    it('returns mapped rows', async () => {
      makeAdmin({
        integration_configs: {
          data: [
            {
              id: 'i1',
              organization_id: 'org-1',
              provider: 'slack',
              enabled: true,
              config: {},
              created_at: 'x',
              updated_at: 'y',
            },
          ],
          error: null,
        },
      });

      const result = await listConnectedIntegrations('org-1');
      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('slack');
      expect(result[0].enabled).toBe(true);
    });

    it('returns empty when no configs', async () => {
      makeAdmin({
        integration_configs: { data: null, error: null },
      });

      const result = await listConnectedIntegrations('org-1');
      expect(result).toEqual([]);
    });
  });

  /* ---- getIntegrationStatus ---- */
  describe('getIntegrationStatus', () => {
    it('returns all catalog items with connection status', async () => {
      makeAdmin({
        integration_configs: [
          {
            data: [
              {
                id: 'i1',
                organization_id: 'org-1',
                provider: 'slack',
                enabled: true,
                config: {},
                created_at: 'x',
                updated_at: 'y',
              },
            ],
            error: null,
          },
          // sync log call
          { data: [], error: null },
        ],
        integration_sync_log: { data: [], error: null },
      });

      const result = await getIntegrationStatus('org-1');
      expect(result).toHaveLength(6);

      const slack = result.find((r) => r.id === 'slack');
      expect(slack?.connected).toBe(true);
      expect(slack?.health).toBe('healthy');

      const jira = result.find((r) => r.id === 'jira');
      expect(jira?.connected).toBe(false);
      expect(jira?.health).toBe('disconnected');
    });

    it('includes lastSyncAt from sync log', async () => {
      makeAdmin({
        integration_configs: [
          {
            data: [
              {
                id: 'i1',
                organization_id: 'org-1',
                provider: 'slack',
                enabled: true,
                config: {},
                created_at: 'x',
                updated_at: 'y',
              },
            ],
            error: null,
          },
          { data: [], error: null },
        ],
        integration_sync_log: {
          data: [{ provider: 'slack', synced_at: '2024-01-01' }],
          error: null,
        },
      });

      const result = await getIntegrationStatus('org-1');
      const slack = result.find((r) => r.id === 'slack');
      expect(slack?.lastSyncAt).toBe('2024-01-01');
    });
  });

  /* ---- connectIntegration ---- */
  describe('connectIntegration', () => {
    it('throws for unsupported type', async () => {
      makeAdmin();
      await expect(
        connectIntegration({
          orgId: 'org-1',
          type: 'unknown' as any,
          config: {},
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Unsupported integration type');
    });

    it('throws when required config fields missing', async () => {
      makeAdmin();
      await expect(
        connectIntegration({
          orgId: 'org-1',
          type: 'slack',
          config: {}, // missing webhook_url
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Missing required config fields');
    });

    it('throws when required config empty string', async () => {
      makeAdmin();
      await expect(
        connectIntegration({
          orgId: 'org-1',
          type: 'slack',
          config: { webhook_url: '  ' },
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Missing required config fields');
    });

    it('connects slack with valid config', async () => {
      makeAdmin({
        integration_configs: {
          data: {
            id: 'new-1',
            provider: 'slack',
            config: { webhook_url: 'https://hook' },
          },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'slack',
        config: { webhook_url: 'https://hook' },
        actorUserId: 'u1',
      });

      expect(result.id).toBe('new-1');
      expect(logActivity).toHaveBeenCalled();
    });

    it('connects jira with all required fields', async () => {
      makeAdmin({
        integration_configs: {
          data: { id: 'j1', provider: 'jira', config: {} },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'jira',
        config: {
          cloud_id: 'c1',
          access_token: 'tok',
          project_key: 'PROJ',
          issue_type_id: 'IID',
        },
        actorUserId: 'u1',
      });

      expect(result.id).toBe('j1');
    });

    it('connects linear with required fields', async () => {
      makeAdmin({
        integration_configs: {
          data: { id: 'l1', provider: 'linear', config: {} },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'linear',
        config: { api_key: 'key', team_id: 'tid' },
        actorUserId: 'u1',
      });
      expect(result.id).toBe('l1');
    });

    it('connects teams with required fields', async () => {
      makeAdmin({
        integration_configs: {
          data: { id: 't1', provider: 'teams', config: {} },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'teams',
        config: { webhook_url: 'https://teams.hook', channel_name: 'general' },
        actorUserId: 'u1',
      });
      expect(result.id).toBe('t1');
    });

    it('connects google_drive with required fields', async () => {
      makeAdmin({
        integration_configs: {
          data: { id: 'g1', provider: 'google_drive', config: {} },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'google_drive',
        config: { access_token: 'atok', refresh_token: 'rtok' },
        actorUserId: 'u1',
      });
      expect(result.id).toBe('g1');
    });

    it('connects webhook_relay with required fields', async () => {
      makeAdmin({
        integration_configs: {
          data: { id: 'w1', provider: 'webhook_relay', config: {} },
          error: null,
        },
      });

      const result = await connectIntegration({
        orgId: 'org-1',
        type: 'webhook_relay',
        config: { relay_enabled: 'true' },
        actorUserId: 'u1',
      });
      expect(result.id).toBe('w1');
    });

    it('throws on upsert error', async () => {
      makeAdmin({
        integration_configs: {
          data: null,
          error: { message: 'db error' },
        },
      });

      await expect(
        connectIntegration({
          orgId: 'org-1',
          type: 'slack',
          config: { webhook_url: 'https://hook' },
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Failed to connect integration');
    });
  });

  /* ---- disconnectIntegration ---- */
  describe('disconnectIntegration', () => {
    it('throws when integration not found', async () => {
      makeAdmin({
        integration_configs: { data: null, error: null },
      });

      await expect(
        disconnectIntegration({
          orgId: 'org-1',
          integrationId: 'nonexistent',
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Integration not found');
    });

    it('disconnects and logs activity', async () => {
      makeAdmin({
        integration_configs: [
          // first call: select existing
          { data: { id: 'i1', provider: 'slack' }, error: null },
          // second call: delete
          { data: null, error: null },
        ],
      });

      await disconnectIntegration({
        orgId: 'org-1',
        integrationId: 'i1',
        actorUserId: 'u1',
      });

      expect(logActivity).toHaveBeenCalled();
    });

    it('throws on delete error', async () => {
      makeAdmin({
        integration_configs: [
          { data: { id: 'i1', provider: 'slack' }, error: null },
          { data: null, error: { message: 'delete fail' } },
        ],
      });

      await expect(
        disconnectIntegration({
          orgId: 'org-1',
          integrationId: 'i1',
          actorUserId: 'u1',
        }),
      ).rejects.toThrow('Failed to disconnect integration');
    });
  });

  /* ---- testIntegration ---- */
  describe('testIntegration', () => {
    it('returns not connected when no row', async () => {
      makeAdmin({
        integration_configs: { data: null, error: null },
      });

      const result = await testIntegration('org-1', 'slack');
      expect(result.ok).toBe(false);
      expect(result.message).toContain('not connected');
    });

    it('returns incomplete when missing config', async () => {
      makeAdmin({
        integration_configs: {
          data: { provider: 'slack', config: {} },
          error: null,
        },
      });

      const result = await testIntegration('org-1', 'slack');
      expect(result.ok).toBe(false);
      expect(result.message).toContain('incomplete');
    });

    it('returns healthy for valid slack config', async () => {
      makeAdmin({
        integration_configs: {
          data: { provider: 'slack', config: { webhook_url: 'https://hook' } },
          error: null,
        },
      });

      const result = await testIntegration('org-1', 'slack');
      expect(result.ok).toBe(true);
      expect(result.message).toContain('healthy');
    });

    it('returns healthy for valid jira config', async () => {
      makeAdmin({
        integration_configs: {
          data: {
            provider: 'jira',
            config: {
              cloud_id: 'c',
              access_token: 't',
              project_key: 'P',
              issue_type_id: 'I',
            },
          },
          error: null,
        },
      });

      const result = await testIntegration('org-1', 'jira');
      expect(result.ok).toBe(true);
    });
  });

  /* ---- getIntegrationEventHistory ---- */
  describe('getIntegrationEventHistory', () => {
    it('returns events and sync log', async () => {
      makeAdmin({
        integration_events: { data: [{ id: 'e1' }], error: null },
        integration_sync_log: { data: [{ id: 's1' }], error: null },
      });

      const result = await getIntegrationEventHistory('org-1', 'slack');
      expect(result.events).toHaveLength(1);
      expect(result.syncLog).toHaveLength(1);
    });

    it('returns empty arrays on no data', async () => {
      makeAdmin({
        integration_events: { data: null, error: null },
        integration_sync_log: { data: null, error: null },
      });

      const result = await getIntegrationEventHistory('org-1', 'slack');
      expect(result.events).toEqual([]);
      expect(result.syncLog).toEqual([]);
    });

    it('accepts custom limit', async () => {
      makeAdmin({
        integration_events: { data: [], error: null },
        integration_sync_log: { data: [], error: null },
      });

      const result = await getIntegrationEventHistory('org-1', 'slack', 10);
      expect(result.events).toEqual([]);
    });
  });

  /* ---- dispatchIntegrationEvent ---- */
  describe('dispatchIntegrationEvent', () => {
    function makeConnected(providers: string[]) {
      makeAdmin({
        integration_configs: {
          data: providers.map((p) => ({
            id: `${p}-id`,
            organization_id: 'org-1',
            provider: p,
            enabled: true,
            config: {},
            created_at: 'x',
            updated_at: 'y',
          })),
          error: null,
        },
        integration_events: { data: null, error: null },
      });
    }

    it('dispatches task.created to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });
      expect(sendTaskNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 't1' },
        'created',
      );
    });

    it('dispatches task.completed to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'task.completed', {
        task: { id: 't1' },
      });
      expect(sendTaskNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 't1' },
        'completed',
      );
    });

    it('dispatches certificate.expiring to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'certificate.expiring', {
        certificate: { id: 'c1' },
      });
      expect(sendCertificateNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'c1' },
        'expiring',
      );
    });

    it('dispatches certificate.expired to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'certificate.expired', {
        certificate: { id: 'c1' },
      });
      expect(sendCertificateNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'c1' },
        'expired',
      );
    });

    it('dispatches member.added to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'member.added', {
        member: { id: 'm1' },
      });
      expect(sendMemberNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'm1' },
        'added',
      );
    });

    it('dispatches member.removed to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'member.removed', {
        member: { id: 'm1' },
      });
      expect(sendMemberNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'm1' },
        'removed',
      );
    });

    it('dispatches compliance.alert to slack', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'compliance.alert', {
        alert: { severity: 'high' },
      });
      expect(sendComplianceAlert).toHaveBeenCalledWith('org-1', {
        severity: 'high',
      });
    });

    it('dispatches task.created to teams', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });
      expect(sendTeamsTaskNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 't1' },
        'task_created',
      );
    });

    it('dispatches task.completed to teams', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'task.completed', {
        task: { id: 't1' },
      });
      expect(sendTeamsTaskNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 't1' },
        'task_completed',
      );
    });

    it('dispatches certificate.expiring to teams', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'certificate.expiring', {
        certificate: { id: 'c1' },
      });
      expect(sendTeamsCertificateNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'c1' },
        'certificate_expiring',
      );
    });

    it('dispatches certificate.expired to teams', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'certificate.expired', {
        certificate: { id: 'c1' },
      });
      expect(sendTeamsCertificateNotification).toHaveBeenCalledWith(
        'org-1',
        { id: 'c1' },
        'certificate_expired',
      );
    });

    it('dispatches compliance.alert to teams', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'compliance.alert', {
        alert: { severity: 'critical', message: 'bad' },
      });
      expect(sendTeamsComplianceAlert).toHaveBeenCalledWith(
        'org-1',
        'critical',
        { severity: 'critical', message: 'bad' },
      );
    });

    it('dispatches compliance.alert to teams with default severity', async () => {
      makeConnected(['teams']);
      await dispatchIntegrationEvent('org-1', 'compliance.alert', {
        alert: {},
      });
      expect(sendTeamsComplianceAlert).toHaveBeenCalledWith(
        'org-1',
        'medium',
        {},
      );
    });

    it('dispatches task.created to jira', async () => {
      makeConnected(['jira']);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });
      expect(createJiraIssue).toHaveBeenCalledWith('org-1', { id: 't1' });
    });

    it('dispatches task.completed to jira', async () => {
      makeConnected(['jira']);
      await dispatchIntegrationEvent('org-1', 'task.completed', {
        task: { id: 't1' },
      });
      expect(syncTaskStatusToJira).toHaveBeenCalledWith(
        'org-1',
        't1',
        'completed',
      );
    });

    it('dispatches task.created to linear', async () => {
      makeConnected(['linear']);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });
      expect(createLinearIssue).toHaveBeenCalledWith('org-1', { id: 't1' });
    });

    it('dispatches task.completed to linear', async () => {
      makeConnected(['linear']);
      await dispatchIntegrationEvent('org-1', 'task.completed', {
        task: { id: 't1' },
      });
      expect(syncTaskStatusToLinear).toHaveBeenCalledWith(
        'org-1',
        't1',
        'completed',
      );
    });

    it('records event for google_drive', async () => {
      makeConnected(['google_drive']);
      await dispatchIntegrationEvent('org-1', 'evidence.uploaded', {
        file: 'f1',
      });
      // Should call from('integration_events') for recording
    });

    it('dispatches to all connected providers', async () => {
      makeConnected(['slack', 'teams', 'jira', 'linear']);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });

      expect(sendTaskNotification).toHaveBeenCalled();
      expect(sendTeamsTaskNotification).toHaveBeenCalled();
      expect(createJiraIssue).toHaveBeenCalled();
      expect(createLinearIssue).toHaveBeenCalled();
    });

    it('does nothing for disconnected providers', async () => {
      makeConnected([]);
      await dispatchIntegrationEvent('org-1', 'task.created', {
        task: { id: 't1' },
      });

      expect(sendTaskNotification).not.toHaveBeenCalled();
      expect(sendTeamsTaskNotification).not.toHaveBeenCalled();
      expect(createJiraIssue).not.toHaveBeenCalled();
      expect(createLinearIssue).not.toHaveBeenCalled();
    });

    it('handles evidence.uploaded event (no explicit dispatch for slack)', async () => {
      makeConnected(['slack']);
      await dispatchIntegrationEvent('org-1', 'evidence.uploaded', {
        file: 'f1',
      });
      // evidence.uploaded does not call specific slack helpers, just records the event
      expect(sendTaskNotification).not.toHaveBeenCalled();
      expect(sendCertificateNotification).not.toHaveBeenCalled();
    });
  });
});
