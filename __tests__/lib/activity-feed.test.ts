/**
 * @jest-environment node
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

let mockAdmin: {
  from: ReturnType<typeof mockSupabase>['client']['from'];
  auth: { admin: { getUserById: jest.Mock } };
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

import { getActivityFeed, logActivity } from '@/lib/activity/feed';

describe('activity feed helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs a system activity entry when actorId is null', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'activity_feed' && operation.action === 'insert') {
          return {
            data: {
              id: 'activity-1',
              org_id: 'org-1',
              actor_id: null,
              actor_email: 'system@formaos.com',
              actor_name: 'System',
              action: 'created',
              resource_type: 'framework',
              resource_id: 'iso27001',
              resource_name: 'ISO 27001',
              metadata: { path: '/app/compliance/frameworks' },
              created_at: '2026-03-21T00:00:00.000Z',
            },
            error: null,
          };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = {
      from: supabase.client.from,
      auth: { admin: { getUserById: jest.fn() } },
    };

    const result = await logActivity(
      'org-1',
      null,
      'created',
      {
        type: 'framework',
        id: 'iso27001',
        name: 'ISO 27001',
        path: '/app/compliance/frameworks',
      },
      {},
    );

    expect(result.actor_email).toBe('system@formaos.com');
    expect(result.actor_name).toBe('System');

    const insert = supabase.operations.find(
      (operation) => operation.table === 'activity_feed' && operation.action === 'insert',
    );
    expect(insert?.values).toEqual(
      expect.objectContaining({
        org_id: 'org-1',
        actor_id: null,
        action: 'created',
      }),
    );
  });

  it('resolves actor metadata and throws when the insert fails', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'user_profiles') {
          return {
            data: { full_name: 'Taylor Example' },
            error: null,
          };
        }

        if (operation.table === 'activity_feed' && operation.action === 'insert') {
          return {
            data: null,
            error: { message: 'insert failed' },
          };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = {
      from: supabase.client.from,
      auth: {
        admin: {
          getUserById: jest.fn().mockResolvedValue({
            data: { user: { email: 'taylor@example.com' } },
          }),
        },
      },
    };

    await expect(
      logActivity(
        'org-1',
        'user-1',
        'updated',
        { type: 'task', id: 'task-1', name: 'Task 1' },
        { source: 'test' },
      ),
    ).rejects.toThrow('insert failed');

    expect(mockAdmin.auth.admin.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('gracefully skips writes when the activity feed table is unavailable', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'activity_feed' && operation.action === 'insert') {
          return {
            data: null,
            error: {
              code: 'PGRST205',
              message: "Could not find the table 'public.activity_feed' in the schema cache",
            },
          };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = {
      from: supabase.client.from,
      auth: { admin: { getUserById: jest.fn() } },
    };

    await expect(
      logActivity('org-1', null, 'created', { type: 'task', id: 'task-1' }),
    ).resolves.toBeNull();
  });

  it('returns a paginated feed with a next cursor when more rows exist than the limit', async () => {
    const rows = [
      {
        id: 'activity-3',
        org_id: 'org-1',
        created_at: '2026-03-21T03:00:00.000Z',
      },
      {
        id: 'activity-2',
        org_id: 'org-1',
        created_at: '2026-03-21T02:00:00.000Z',
      },
      {
        id: 'activity-1',
        org_id: 'org-1',
        created_at: '2026-03-21T01:00:00.000Z',
      },
    ];
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'activity_feed' && operation.action === 'select') {
          return { data: rows, error: null };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = {
      from: supabase.client.from,
      auth: { admin: { getUserById: jest.fn() } },
    };

    const result = await getActivityFeed('org-1', { limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBeTruthy();
    expect(supabase.getLastOperation('activity_feed')?.limit).toBe(3);
  });

  it('returns an empty feed when the activity_feed table is unavailable', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'activity_feed' && operation.action === 'select') {
          return {
            data: null,
            error: {
              code: 'PGRST205',
              message: "Could not find the table 'public.activity_feed' in the schema cache",
            },
          };
        }

        return { data: null, error: null };
      },
    });

    mockAdmin = {
      from: supabase.client.from,
      auth: { admin: { getUserById: jest.fn() } },
    };

    await expect(getActivityFeed('org-1')).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });
});
