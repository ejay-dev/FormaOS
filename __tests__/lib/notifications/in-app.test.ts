/**
 * Tests for lib/notifications/channels/in-app.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/supabase/schema-compat', () => ({
  extractMissingSupabaseColumn: jest.fn(),
  isMissingSupabaseTableError: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');
const {
  isMissingSupabaseTableError,
  extractMissingSupabaseColumn,
} = require('@/lib/supabase/schema-compat');

import { createInAppNotification } from '@/lib/notifications/channels/in-app';

beforeEach(() => {
  jest.clearAllMocks();
  isMissingSupabaseTableError.mockReturnValue(false);
  extractMissingSupabaseColumn.mockReturnValue(null);
});

const recipient = { orgId: 'org-1', userId: 'user-1' };
const event = {
  type: 'TASK_ASSIGNED',
  title: 'New Task',
  body: 'You have a new task',
  data: {},
  priority: 'normal' as const,
};

describe('createInAppNotification', () => {
  it('creates notification in notifications table', async () => {
    const notif = {
      id: 'n1',
      org_id: 'org-1',
      user_id: 'user-1',
      type: 'TASK_ASSIGNED',
      title: 'New Task',
      body: 'You have a new task',
      data: {},
      priority: 'normal',
      read_at: null,
      archived_at: null,
      created_at: '2024-01-01',
    };
    const client = {
      from: jest.fn(() => createBuilder({ data: notif, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await createInAppNotification(recipient, event);
    expect(result.id).toBe('n1');
    expect(client.from).toHaveBeenCalledWith('notifications');
  });

  it('falls back to legacy table when notifications table missing', async () => {
    const legacyData = {
      id: 'n2',
      organization_id: 'org-1',
      user_id: 'user-1',
      type: 'TASK_ASSIGNED',
      title: 'New Task',
      message: 'You have a new task',
      metadata: {},
      read_at: null,
      created_at: '2024-01-01',
    };
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return createBuilder({
            data: null,
            error: { message: 'table not found', code: '42P01' },
          });
        }
        return createBuilder({ data: legacyData, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    isMissingSupabaseTableError.mockReturnValue(true);

    const result = await createInAppNotification(recipient, event);
    expect(result.id).toBe('n2');
  });

  it('throws on non-table-missing error', async () => {
    const client = {
      from: jest.fn(() =>
        createBuilder({ data: null, error: { message: 'permission denied' } }),
      ),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    isMissingSupabaseTableError.mockReturnValue(false);

    await expect(createInAppNotification(recipient, event)).rejects.toThrow(
      'permission denied',
    );
  });

  it('handles event with dedupeKey', async () => {
    const notif = {
      id: 'n3',
      org_id: 'org-1',
      user_id: 'user-1',
      type: 'TASK_ASSIGNED',
      title: 'New Task',
      body: 'Body',
      data: { dedupeKey: 'dd1' },
      priority: 'normal',
      read_at: null,
      archived_at: null,
      created_at: '2024-01-01',
    };
    const client = {
      from: jest.fn(() => createBuilder({ data: notif, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const eventWithDedupe = { ...event, dedupeKey: 'dd1' };
    const result = await createInAppNotification(recipient, eventWithDedupe);
    expect(result.id).toBe('n3');
  });

  it('handles event with data.dedupeKey', async () => {
    const notif = {
      id: 'n4',
      org_id: 'org-1',
      user_id: 'user-1',
      type: 'TASK_ASSIGNED',
      title: 'New Task',
      body: 'Body',
      data: { dedupeKey: 'dd2' },
      priority: 'high',
      read_at: null,
      archived_at: null,
      created_at: '2024-01-01',
    };
    const client = {
      from: jest.fn(() => createBuilder({ data: notif, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const eventWithDataDedupe = {
      ...event,
      priority: 'high' as const,
      data: { dedupeKey: 'dd2' },
    };
    const result = await createInAppNotification(
      recipient,
      eventWithDataDedupe,
    );
    expect(result.id).toBe('n4');
  });

  it('handles legacy fallback with missing column retry', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // notifications table missing
          return createBuilder({
            data: null,
            error: { message: 'table missing', code: '42P01' },
          });
        }
        if (callCount === 2) {
          // first legacy insert fails with missing column
          return createBuilder({
            data: null,
            error: { message: 'column organization_id does not exist' },
          });
        }
        // retry succeeds
        return createBuilder({
          data: {
            id: 'n5',
            organization_id: 'org-1',
            user_id: 'user-1',
            type: 'TASK_ASSIGNED',
            message: 'Body',
            metadata: {},
            created_at: '2024-01-01',
          },
          error: null,
        });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    isMissingSupabaseTableError.mockReturnValue(true);
    extractMissingSupabaseColumn
      .mockReturnValueOnce('organization_id')
      .mockReturnValueOnce(null);

    const result = await createInAppNotification(recipient, event);
    expect(result.id).toBe('n5');
  });
});
