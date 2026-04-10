/** @jest-environment node */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((v: unknown) => v),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import { createJiraIssue, syncTaskStatusToJira } from '@/lib/integrations/jira';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function mockSupabase(configData: unknown = null, syncLogData: unknown = null) {
  const sb: Record<string, jest.Mock> = {};
  sb.select = jest.fn().mockReturnValue(sb);
  sb.eq = jest.fn().mockReturnValue(sb);
  sb.maybeSingle = jest.fn().mockResolvedValue({ data: configData });
  sb.insert = jest.fn().mockResolvedValue({ data: null, error: null });

  // Sync log chain — always supports select/eq/maybeSingle
  const syncChain: Record<string, jest.Mock> = {};
  syncChain.select = jest.fn().mockReturnValue(syncChain);
  syncChain.eq = jest.fn().mockReturnValue(syncChain);
  syncChain.maybeSingle = jest.fn().mockResolvedValue({ data: syncLogData });
  syncChain.insert = jest.fn().mockResolvedValue({ data: null, error: null });

  const client = {
    from: jest.fn((table: string) => {
      if (table === 'integration_configs') return sb;
      if (table === 'integration_sync_log') return syncChain;
      return sb;
    }),
  };
  (createSupabaseServerClient as jest.Mock).mockResolvedValue(client);
  return client;
}

const JIRA_CONFIG = {
  cloud_id: 'cloud123',
  access_token: 'tok',
  refresh_token: 'ref',
  project_key: 'COMP',
  issue_type_id: '10001',
  enabled_events: ['task_created'],
};

describe('lib/integrations/jira', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('createJiraIssue', () => {
    it('returns error when Jira not configured', async () => {
      mockSupabase(null);
      const result = await createJiraIssue('org1', { id: 't1', title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('creates issue successfully', async () => {
      mockSupabase({ config: JIRA_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'COMP-123' }),
      });

      const result = await createJiraIssue('org1', {
        id: 't1',
        title: 'Fix firewall',
        description: 'Urgent fix',
        priority: 'high',
        dueDate: '2026-02-01',
        framework: 'SOC2',
        controlRef: 'CC1.1',
      });

      expect(result.success).toBe(true);
      expect(result.issueKey).toBe('COMP-123');
    });

    it('handles Jira API error', async () => {
      mockSupabase({ config: JIRA_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const result = await createJiraIssue('org1', { id: 't1', title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('400');
    });

    it('handles fetch exception', async () => {
      mockSupabase({ config: JIRA_CONFIG });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await createJiraIssue('org1', { id: 't1', title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('creates issue without optional fields', async () => {
      mockSupabase({ config: JIRA_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'COMP-124' }),
      });

      const result = await createJiraIssue('org1', {
        id: 't2',
        title: 'Minimal',
      });
      expect(result.success).toBe(true);
    });

    it('maps priority correctly', async () => {
      mockSupabase({ config: JIRA_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ key: 'COMP-125' }),
      });

      await createJiraIssue('org1', {
        id: 't3',
        title: 'Critical',
        priority: 'critical',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.fields.priority.name).toBe('Highest');
    });
  });

  describe('syncTaskStatusToJira', () => {
    it('returns error when Jira not configured', async () => {
      mockSupabase(null);
      const result = await syncTaskStatusToJira('org1', 't1', 'completed');
      expect(result.success).toBe(false);
    });

    it('returns error when no synced issue found', async () => {
      mockSupabase({ config: JIRA_CONFIG }, null);
      const result = await syncTaskStatusToJira('org1', 't1', 'completed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No synced');
    });

    it('transitions issue to Done', async () => {
      mockSupabase({ config: JIRA_CONFIG }, { remote_entity_id: 'COMP-100' });
      // Get transitions
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transitions: [
            { id: '31', name: 'Done' },
            { id: '21', name: 'In Progress' },
          ],
        }),
      });
      // Do transition
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await syncTaskStatusToJira('org1', 't1', 'completed');
      expect(result.success).toBe(true);
    });

    it('returns error when no matching transition', async () => {
      mockSupabase({ config: JIRA_CONFIG }, { remote_entity_id: 'COMP-100' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transitions: [{ id: '1', name: 'Reopen' }],
        }),
      });

      const result = await syncTaskStatusToJira('org1', 't1', 'completed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No matching');
    });

    it('returns error when transitions API fails', async () => {
      mockSupabase({ config: JIRA_CONFIG }, { remote_entity_id: 'COMP-100' });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      const result = await syncTaskStatusToJira('org1', 't1', 'in_progress');
      expect(result.success).toBe(false);
    });
  });
});
