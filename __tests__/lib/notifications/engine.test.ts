/**
 * Tests for Notification Engine
 */

function createBuilder(
  result: { data?: any; error?: any } = { data: [], error: null },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'eq',
    'in',
    'not',
    'gte',
    'order',
    'limit',
    'insert',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => {
  const ac: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: { admin: { getUserById: jest.fn() } },
  };
  return {
    createSupabaseAdminClient: jest.fn(() => ac),
    __adminClient: ac,
  };
});
function getAdminClient() {
  return require('@/lib/supabase/admin').__adminClient;
}

jest.mock('@/lib/supabase/schema-compat', () => ({
  isMissingSupabaseTableError: jest.fn(() => false),
}));

// Channel mocks INSIDE factories (avoids TDZ with SWC)
jest.mock('@/lib/notifications/channels/in-app', () => {
  const fn = jest.fn().mockResolvedValue({ id: 'notif-1' });
  return { createInAppNotification: fn, __mock: fn };
});
jest.mock('@/lib/notifications/channels/email', () => {
  const fn = jest.fn().mockResolvedValue(undefined);
  return { deliverEmailNotification: fn, __mock: fn };
});
jest.mock('@/lib/notifications/channels/slack', () => {
  const fn = jest.fn().mockResolvedValue(undefined);
  return { deliverSlackNotification: fn, __mock: fn };
});
jest.mock('@/lib/notifications/channels/teams', () => {
  const fn = jest.fn().mockResolvedValue(undefined);
  return { deliverTeamsNotification: fn, __mock: fn };
});

function getMockInApp() {
  return require('@/lib/notifications/channels/in-app').__mock;
}
function getMockEmail() {
  return require('@/lib/notifications/channels/email').__mock;
}
function getMockSlack() {
  return require('@/lib/notifications/channels/slack').__mock;
}

import { notify } from '@/lib/notifications/engine';

const ORG = 'org-1';
const USER = 'user-1';

const baseEvent = {
  type: 'task.assigned' as const,
  title: 'Task assigned',
  body: 'You have a new task',
  priority: 'normal' as const,
};

function setupUserContext() {
  getAdminClient().from.mockImplementation((table: string) => {
    if (table === 'user_profiles')
      return createBuilder({ data: { full_name: 'Alice' }, error: null });
    if (table === 'notification_preferences')
      return createBuilder({ data: [], error: null });
    if (table === 'notification_channels')
      return createBuilder({ data: [], error: null });
    if (table === 'notifications')
      return createBuilder({ data: null, error: null });
    return createBuilder();
  });
  getAdminClient().auth.admin.getUserById.mockResolvedValue({
    data: {
      user: {
        id: USER,
        email: 'alice@test.com',
        user_metadata: { timezone: 'UTC' },
      },
    },
  });
}

describe('notify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupUserContext();
  });

  it('delivers in_app by default for simple recipient array', async () => {
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].status).toBe('delivered');
    expect(result.results[0].channels).toContain('in_app');
    expect(getMockInApp()).toHaveBeenCalled();
  });

  it('skips recipient when user context not found', async () => {
    getAdminClient().auth.admin.getUserById.mockResolvedValue({
      data: { user: null },
    });
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.results[0].status).toBe('skipped');
    expect(result.results[0].reason).toBe('recipient_not_found');
  });

  it('skips duplicate notifications', async () => {
    const event = { ...baseEvent, dedupeKey: 'task-123' };
    getAdminClient().from.mockImplementation((table: string) => {
      if (table === 'user_profiles')
        return createBuilder({ data: { full_name: 'Alice' }, error: null });
      if (table === 'notifications')
        return createBuilder({ data: { id: 'existing' }, error: null });
      if (table === 'notification_preferences')
        return createBuilder({ data: [], error: null });
      if (table === 'notification_channels')
        return createBuilder({ data: [], error: null });
      return createBuilder();
    });
    const result = await notify(ORG, [USER], event);
    expect(result.results[0].status).toBe('skipped');
    expect(result.results[0].reason).toBe('duplicate');
  });

  it('delivers to email when enabled by default', async () => {
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.results[0].channels).toContain('email');
    expect(getMockEmail()).toHaveBeenCalled();
  });

  it('delivers to slack when user has slack preference enabled', async () => {
    getAdminClient().from.mockImplementation((table: string) => {
      if (table === 'user_profiles')
        return createBuilder({ data: { full_name: 'Alice' }, error: null });
      if (table === 'notification_preferences')
        return createBuilder({
          data: [
            {
              id: 'p1',
              user_id: USER,
              org_id: ORG,
              channel: 'slack',
              event_type: 'task.assigned',
              enabled: true,
              digest_frequency: 'instant',
              quiet_hours: null,
            },
          ],
          error: null,
        });
      if (table === 'notification_channels')
        return createBuilder({
          data: [
            {
              id: 'ch1',
              user_id: USER,
              org_id: ORG,
              channel_type: 'slack',
              config: {},
              verified: true,
            },
          ],
          error: null,
        });
      if (table === 'notifications')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.results[0].channels).toContain('slack');
    expect(getMockSlack()).toHaveBeenCalled();
  });

  it('resolves role-based recipients', async () => {
    getAdminClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({
          data: [{ user_id: 'u1' }, { user_id: 'u2' }],
          error: null,
        });
      if (table === 'user_profiles')
        return createBuilder({ data: { full_name: 'Bob' }, error: null });
      if (table === 'notification_preferences')
        return createBuilder({ data: [], error: null });
      if (table === 'notification_channels')
        return createBuilder({ data: [], error: null });
      if (table === 'notifications')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });
    const result = await notify(ORG, { roles: ['admin'] }, baseEvent);
    expect(result.results).toHaveLength(2);
  });

  it('handles in_app delivery failure gracefully', async () => {
    getMockInApp().mockRejectedValueOnce(new Error('in_app error'));
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.results[0].channels).toEqual([]);
    expect(result.results[0].reason).toMatch(/fail|disabled/);
  });

  it('handles email delivery failure as partial', async () => {
    getMockEmail().mockRejectedValueOnce(new Error('smtp fail'));
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.results[0].channels).toContain('in_app');
    expect(result.results[0].channels).not.toContain('email');
  });

  it('bypasses quiet hours for critical priority', async () => {
    getAdminClient().from.mockImplementation((table: string) => {
      if (table === 'user_profiles')
        return createBuilder({ data: { full_name: 'Alice' }, error: null });
      if (table === 'notification_preferences')
        return createBuilder({
          data: [
            {
              id: 'p1',
              user_id: USER,
              org_id: ORG,
              channel: 'email',
              event_type: 'task.assigned',
              enabled: true,
              digest_frequency: 'instant',
              quiet_hours: { enabled: true, start: '00:00', end: '23:59' },
            },
          ],
          error: null,
        });
      if (table === 'notification_channels')
        return createBuilder({ data: [], error: null });
      if (table === 'notifications')
        return createBuilder({ data: null, error: null });
      return createBuilder();
    });
    const criticalEvent = { ...baseEvent, priority: 'critical' as const };
    const result = await notify(ORG, [USER], criticalEvent);
    expect(result.results[0].channels).toContain('email');
  });

  it('returns event metadata in result', async () => {
    const result = await notify(ORG, [USER], baseEvent);
    expect(result.orgId).toBe(ORG);
    expect(result.eventType).toBe('task.assigned');
  });

  it('de-duplicates recipient IDs in array', async () => {
    const result = await notify(ORG, [USER, USER, USER], baseEvent);
    expect(result.results).toHaveLength(1);
  });

  it('filters out empty/falsy recipient IDs', async () => {
    const result = await notify(
      ORG,
      [USER, '', null as unknown as string],
      baseEvent,
    );
    expect(result.results).toHaveLength(1);
  });
});
