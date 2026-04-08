/**
 * Branch-coverage tests for lib/integrations/linear.ts
 * Targets 38 uncovered branches
 */

jest.mock('server-only', () => ({}));

const mockLinearFetch = jest.fn();
global.fetch = mockLinearFetch as any;

function createBuilder(data: any = null, error: any = null) {
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
    'gt',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: any) => resolve({ data, error });
  return b;
}

let callIdx = 0;
let builders: any[] = [];
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => {
      const idx = callIdx++;
      return builders[idx] || createBuilder();
    }),
  })),
}));

jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((c: any) => c),
}));

import {
  createLinearIssue,
  syncTaskStatusToLinear,
} from '@/lib/integrations/linear';

describe('linear integration branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callIdx = 0;
    builders = [];
    mockLinearFetch.mockReset();
  });

  describe('createLinearIssue', () => {
    it('returns error when linear not configured', async () => {
      builders = [createBuilder(null)]; // no config found
      const result = await createLinearIssue('org1', {
        id: 't1',
        title: 'Task',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('creates issue successfully', async () => {
      builders = [
        createBuilder({
          config: {
            api_key: 'key',
            team_id: 'team1',
            enabled_events: ['task_created'],
          },
          enabled: true,
        }),
      ];
      callIdx = 0;
      // Reset for second createClient call
      const syncLogBuilder = createBuilder(null);

      mockLinearFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: 'lin-1',
                identifier: 'FOO-1',
                url: 'https://linear.app/foo/1',
              },
            },
          },
        }),
      });

      // For the second supabase call (sync log insert)
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder(null), // sync log insert
      ];
      callIdx = 0;

      const result = await createLinearIssue('org1', {
        id: 't1',
        title: 'Compliance Task',
        description: 'Desc',
        priority: 2,
        dueDate: '2025-01-01',
        framework: 'SOC2',
        controlRef: 'CC6.1',
      });
      expect(result.success).toBe(true);
      expect(result.issueId).toBe('lin-1');
    });

    it('handles GraphQL errors', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Not authorized' }],
        }),
      });

      const result = await createLinearIssue('org1', {
        id: 't2',
        title: 'Task',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authorized');
    });

    it('handles no issue returned', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { issueCreate: { success: true, issue: null } },
        }),
      });

      const result = await createLinearIssue('org1', {
        id: 't3',
        title: 'Task',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('No issue returned');
    });

    it('handles fetch error', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await createLinearIssue('org1', {
        id: 't4',
        title: 'Task',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('creates issue with minimal task fields', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1' },
          enabled: true,
        }),
        createBuilder(null),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: 'lin-2',
                identifier: 'FOO-2',
                url: 'https://linear.app/2',
              },
            },
          },
        }),
      });

      const result = await createLinearIssue('org1', {
        id: 't5',
        title: 'Minimal',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('syncTaskStatusToLinear', () => {
    it('returns error when linear not configured', async () => {
      builders = [createBuilder(null)];
      callIdx = 0;
      const result = await syncTaskStatusToLinear('org1', 't1', 'completed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('returns error when no synced issue found', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder(null), // no sync log
      ];
      callIdx = 0;

      const result = await syncTaskStatusToLinear('org1', 't1', 'completed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No synced Linear issue');
    });

    it('syncs completed status', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder({ remote_entity_id: 'lin-1' }), // sync log
      ];
      callIdx = 0;

      // First fetch: get states
      mockLinearFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              team: {
                states: {
                  nodes: [
                    { id: 's1', name: 'Done', type: 'completed' },
                    { id: 's2', name: 'In Progress', type: 'started' },
                    { id: 's3', name: 'Backlog', type: 'unstarted' },
                  ],
                },
              },
            },
          }),
        })
        // Second fetch: update issue
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { issueUpdate: { success: true } },
          }),
        });

      const result = await syncTaskStatusToLinear('org1', 't1', 'completed');
      expect(result.success).toBe(true);
    });

    it('syncs in_progress status', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder({ remote_entity_id: 'lin-2' }),
      ];
      callIdx = 0;

      mockLinearFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              team: {
                states: {
                  nodes: [{ id: 's2', name: 'In Progress', type: 'started' }],
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { issueUpdate: { success: true } } }),
        });

      const result = await syncTaskStatusToLinear('org1', 't1', 'in_progress');
      expect(result.success).toBe(true);
    });

    it('returns error when no matching state found', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder({ remote_entity_id: 'lin-3' }),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { team: { states: { nodes: [] } } },
        }),
      });

      const result = await syncTaskStatusToLinear('org1', 't1', 'pending');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No matching state');
    });

    it('handles fetch error in sync', async () => {
      builders = [
        createBuilder({
          config: { api_key: 'key', team_id: 'team1', enabled_events: [] },
          enabled: true,
        }),
        createBuilder({ remote_entity_id: 'lin-4' }),
      ];
      callIdx = 0;

      mockLinearFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await syncTaskStatusToLinear('org1', 't1', 'completed');
      expect(result.success).toBe(false);
      expect(result.error).toContain('403');
    });
  });
});
