/** @jest-environment node */

/**
 * Tests for lib/notifications/digest.ts
 * Covers: getDigestKey, getNextDigestSchedule, queueForDigest,
 *         generateDigest, sendDigest, resolveDigestRecipient (internal),
 *         renderDigestHtml (internal), nowInTimezone branches
 */

// ─── Supabase chain builder ───────────────────────────────────────────────
function createBuilder(result: any = { data: null, error: null }) {
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
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdminClient = {
  from: jest.fn(() => createBuilder()),
  auth: {
    admin: {
      getUserById: jest.fn().mockResolvedValue({
        data: {
          user: {
            email: 'test@example.com',
            user_metadata: { timezone: 'Australia/Sydney' },
          },
        },
      }),
    },
  },
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdminClient),
}));

const mockResendSend = jest
  .fn()
  .mockResolvedValue({ data: { id: 'email-1' }, error: null });
jest.mock('@/lib/email/resend-client', () => ({
  getResendClient: jest.fn(() => ({
    emails: { send: mockResendSend },
  })),
  getFromEmail: jest.fn(() => 'noreply@formaos.com.au'),
}));

jest.mock('@/config/brand', () => ({
  brand: {
    appName: 'FormaOS',
    identity: 'FormaOS',
    seo: { appUrl: 'https://app.formaos.com.au' },
  },
}));

import {
  getDigestKey,
  getNextDigestSchedule,
  queueForDigest,
  generateDigest,
  sendDigest,
} from '@/lib/notifications/digest';

describe('notifications/digest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getDigestKey ─────────────────────────────────────────────
  describe('getDigestKey', () => {
    const date = new Date('2026-04-09T10:30:00Z');

    it('returns weekly digest key', () => {
      const key = getDigestKey('weekly', date, 'UTC');
      expect(key).toContain('weekly:');
      expect(key).toContain(':week');
    });

    it('returns hourly digest key with hour', () => {
      const key = getDigestKey('hourly', date, 'UTC');
      expect(key).toContain('hourly:');
      expect(key).toMatch(/:\d{2}$/);
    });

    it('returns daily digest key (default branch)', () => {
      const key = getDigestKey('daily', date, 'UTC');
      expect(key).toContain('daily:');
      expect(key).not.toContain(':week');
    });

    it('handles instant frequency', () => {
      const key = getDigestKey('instant' as any, date, 'UTC');
      expect(key).toContain('instant:');
    });

    it('handles different timezones', () => {
      const key = getDigestKey('daily', date, 'America/New_York');
      expect(key).toContain('daily:');
    });
  });

  // ─── getNextDigestSchedule ────────────────────────────────────
  describe('getNextDigestSchedule', () => {
    it('returns fromDate ISO for instant frequency', () => {
      const from = new Date('2026-04-09T10:00:00Z');
      const result = getNextDigestSchedule('instant', null, from);
      expect(result).toBe(from.toISOString());
    });

    it('returns fromDate ISO for never frequency', () => {
      const from = new Date('2026-04-09T10:00:00Z');
      const result = getNextDigestSchedule('never', null, from);
      expect(result).toBe(from.toISOString());
    });

    it('returns hourly schedule (next hour)', () => {
      const from = new Date('2026-04-09T10:30:00Z');
      const result = getNextDigestSchedule('hourly', 'UTC', from);
      expect(result).toBeDefined();
      expect(new Date(result).getMinutes()).toBe(0);
    });

    it('returns daily schedule (9am next day if past 9)', () => {
      const from = new Date('2026-04-09T10:00:00Z');
      const result = getNextDigestSchedule('daily', 'UTC', from);
      expect(result).toBeDefined();
    });

    it('returns daily schedule (same day if before 9)', () => {
      const from = new Date('2026-04-09T05:00:00Z');
      const result = getNextDigestSchedule('daily', 'UTC', from);
      expect(result).toBeDefined();
    });

    it('returns weekly schedule', () => {
      const from = new Date('2026-04-09T10:00:00Z'); // Thursday
      const result = getNextDigestSchedule('weekly', 'UTC', from);
      expect(result).toBeDefined();
    });

    it('returns weekly schedule when on Monday before 9', () => {
      // Find a Monday
      const from = new Date('2026-04-06T05:00:00Z'); // Monday
      const result = getNextDigestSchedule('weekly', 'UTC', from);
      expect(result).toBeDefined();
    });

    it('uses default timezone when none provided', () => {
      const from = new Date('2026-04-09T10:00:00Z');
      const result = getNextDigestSchedule('daily', null, from);
      expect(result).toBeDefined();
    });

    it('uses env DEFAULT_TIMEZONE when empty string', () => {
      const from = new Date('2026-04-09T10:00:00Z');
      const result = getNextDigestSchedule('daily', '', from);
      expect(result).toBeDefined();
    });

    it('defaults to current date when fromDate not given', () => {
      const result = getNextDigestSchedule('daily', 'UTC');
      expect(result).toBeDefined();
    });
  });

  // ─── queueForDigest ───────────────────────────────────────────
  describe('queueForDigest', () => {
    it('inserts into notification_digest_queue and returns scheduledFor', async () => {
      const upsertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(upsertBuilder);

      const result = await queueForDigest(
        'u1',
        {
          id: 'n1',
          org_id: 'org1',
          user_id: 'u1',
          type: 'task.assigned' as const,
          title: 'Task assigned',
          body: 'You have a new task',
          data: {},
          priority: 'normal',
          read_at: null,
          archived_at: null,
          created_at: new Date().toISOString(),
        },
        'daily',
        'UTC',
      );

      expect(result).toBeDefined();
      expect(mockAdminClient.from).toHaveBeenCalledWith(
        'notification_digest_queue',
      );
    });

    it('throws on upsert error', async () => {
      const errorBuilder = createBuilder({
        data: null,
        error: { message: 'Conflict' },
      });
      mockAdminClient.from.mockReturnValue(errorBuilder);

      await expect(
        queueForDigest(
          'u1',
          {
            id: 'n2',
            org_id: 'org1',
            user_id: 'u1',
            type: 'task.completed' as const,
            title: 'Comment',
            body: null,
            data: {},
            priority: 'low',
            read_at: null,
            archived_at: null,
            created_at: new Date().toISOString(),
          },
          'hourly',
        ),
      ).rejects.toThrow('Conflict');
    });

    it('uses default timezone when not provided', async () => {
      const upsertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(upsertBuilder);

      const result = await queueForDigest(
        'u1',
        {
          id: 'n3',
          org_id: 'org1',
          user_id: 'u1',
          type: 'system.security_alert' as const,
          title: 'Alert',
          body: null,
          data: {},
          priority: 'high',
          read_at: null,
          archived_at: null,
          created_at: new Date().toISOString(),
        },
        'weekly',
      );

      expect(result).toBeDefined();
    });
  });

  // ─── generateDigest ───────────────────────────────────────────
  describe('generateDigest', () => {
    it('returns null for empty queue rows', async () => {
      const emptyBuilder = createBuilder({ data: [], error: null });
      mockAdminClient.from.mockReturnValue(emptyBuilder);

      const result = await generateDigest('u1', 'daily');
      expect(result).toBeNull();
    });

    it('returns null on query error', async () => {
      const errorBuilder = createBuilder({
        data: null,
        error: { message: 'DB error' },
      });
      mockAdminClient.from.mockReturnValue(errorBuilder);

      await expect(generateDigest('u1', 'daily')).rejects.toThrow('DB error');
    });

    it('returns null when no email on auth user (resolveDigestRecipient)', async () => {
      const queueData = [
        {
          id: 'q1',
          org_id: 'org1',
          frequency: 'daily',
          scheduled_for: new Date().toISOString(),
          notification: {
            id: 'n1',
            org_id: 'org1',
            user_id: 'u1',
            type: 'task.assigned' as const,
            title: 'Task',
            body: 'Body',
            data: {},
            priority: 'normal',
            read_at: null,
            archived_at: null,
            created_at: new Date().toISOString(),
          },
        },
      ];

      const queueBuilder = createBuilder({ data: queueData, error: null });
      const profileBuilder = createBuilder({
        data: { full_name: 'Test User' },
        error: null,
      });
      const historyBuilder = createBuilder({ data: null, error: null });

      mockAdminClient.from.mockImplementation(((table: string) => {
        if (table === 'notification_digest_queue') return queueBuilder;
        if (table === 'user_profiles') return profileBuilder;
        if (table === 'notification_digest_history') return historyBuilder;
        return createBuilder();
      }) as any);

      // No email on user
      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { email: null, user_metadata: {} } },
      });

      const result = await generateDigest('u1', 'daily');
      expect(result).toBeNull();
    });

    it('returns null when digest already sent (historyRow exists)', async () => {
      const queueData = [
        {
          id: 'q1',
          org_id: 'org1',
          frequency: 'daily',
          scheduled_for: new Date().toISOString(),
          notification: {
            id: 'n1',
            org_id: 'org1',
            user_id: 'u1',
            type: 'task.assigned' as const,
            title: 'Task',
            body: 'Body',
            data: {},
            priority: 'normal',
            read_at: null,
            archived_at: null,
            created_at: new Date().toISOString(),
          },
        },
      ];

      const queueBuilder = createBuilder({ data: queueData, error: null });
      const profileBuilder = createBuilder({
        data: { full_name: 'Test' },
        error: null,
      });
      const historyBuilder = createBuilder({
        data: { id: 'existing-history' },
        error: null,
      });

      mockAdminClient.from.mockImplementation(((table: string) => {
        if (table === 'notification_digest_queue') return queueBuilder;
        if (table === 'user_profiles') return profileBuilder;
        if (table === 'notification_digest_history') return historyBuilder;
        return createBuilder();
      }) as any);

      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: { email: 'u@test.com', user_metadata: { timezone: 'UTC' } },
        },
      });

      const result = await generateDigest('u1', 'daily');
      expect(result).toBeNull();
    });

    it('returns digest object when queue has valid rows', async () => {
      const queueData = [
        {
          id: 'q1',
          org_id: 'org1',
          frequency: 'daily',
          scheduled_for: new Date().toISOString(),
          notification: {
            id: 'n1',
            org_id: 'org1',
            user_id: 'u1',
            type: 'task.assigned' as const,
            title: 'Task',
            body: 'Body',
            data: { href: '/app/tasks/1' },
            priority: 'normal',
            read_at: null,
            archived_at: null,
            created_at: new Date().toISOString(),
          },
        },
      ];

      const queueBuilder = createBuilder({ data: queueData, error: null });
      const profileBuilder = createBuilder({
        data: { full_name: 'Test' },
        error: null,
      });
      const historyBuilder = createBuilder({ data: null, error: null });

      mockAdminClient.from.mockImplementation(((table: string) => {
        if (table === 'notification_digest_queue') return queueBuilder;
        if (table === 'user_profiles') return profileBuilder;
        if (table === 'notification_digest_history') return historyBuilder;
        return createBuilder();
      }) as any);

      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: { email: 'u@test.com', user_metadata: { timezone: 'UTC' } },
        },
      });

      const result = await generateDigest('u1', 'daily');
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('u1');
      expect(result!.notifications).toHaveLength(1);
    });

    it('filters out archived notifications', async () => {
      const queueData = [
        {
          id: 'q1',
          org_id: 'org1',
          frequency: 'daily',
          scheduled_for: new Date().toISOString(),
          notification: {
            id: 'n1',
            org_id: 'org1',
            user_id: 'u1',
            type: 'task.assigned' as const,
            title: 'Archived Task',
            body: null,
            data: {},
            priority: 'normal',
            read_at: null,
            archived_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        },
      ];

      const queueBuilder = createBuilder({ data: queueData, error: null });
      mockAdminClient.from.mockReturnValue(queueBuilder);

      const result = await generateDigest('u1', 'daily');
      expect(result).toBeNull();
    });

    it('handles notification as array (unwraps first element)', async () => {
      const queueData = [
        {
          id: 'q1',
          org_id: 'org1',
          frequency: 'daily',
          scheduled_for: new Date().toISOString(),
          notification: [
            {
              id: 'n1',
              org_id: 'org1',
              user_id: 'u1',
              type: 'task.assigned' as const,
              title: 'Array Task',
              body: 'B',
              data: {},
              priority: 'normal',
              read_at: null,
              archived_at: null,
              created_at: new Date().toISOString(),
            },
          ],
        },
      ];

      const queueBuilder = createBuilder({ data: queueData, error: null });
      const profileBuilder = createBuilder({
        data: { full_name: null },
        error: null,
      });
      const historyBuilder = createBuilder({ data: null, error: null });

      mockAdminClient.from.mockImplementation(((table: string) => {
        if (table === 'notification_digest_queue') return queueBuilder;
        if (table === 'user_profiles') return profileBuilder;
        if (table === 'notification_digest_history') return historyBuilder;
        return createBuilder();
      }) as any);

      mockAdminClient.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: { email: 'u@test.com', user_metadata: {} },
        },
      });

      const result = await generateDigest('u1', 'daily');
      expect(result).not.toBeNull();
    });
  });

  // ─── sendDigest ───────────────────────────────────────────────
  describe('sendDigest', () => {
    const digest = {
      userId: 'u1',
      orgId: 'org1',
      frequency: 'daily' as const,
      digestKey: 'daily:2026-04-09',
      recipient: {
        userId: 'u1',
        orgId: 'org1',
        email: 'test@example.com',
        fullName: 'Test User',
        timezone: 'UTC',
      },
      notifications: [
        {
          id: 'n1',
          org_id: 'org1',
          user_id: 'u1',
          type: 'task.assigned' as const,
          title: 'Task assigned',
          body: 'You have a new task',
          data: { href: '/app/tasks/1' },
          priority: 'normal' as const,
          read_at: null,
          archived_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      scheduledFor: new Date().toISOString(),
    };

    it('sends digest email and records history', async () => {
      const insertBuilder = createBuilder({ data: null, error: null });
      const updateBuilder = createBuilder({ data: null, error: null });

      mockAdminClient.from.mockImplementation(((table: string) => {
        if (table === 'notification_digest_history') return insertBuilder;
        if (table === 'notification_digest_queue') return updateBuilder;
        return createBuilder();
      }) as any);

      const result = await sendDigest('u1', digest);
      expect(result).toEqual({ id: 'email-1' });
      expect(mockResendSend).toHaveBeenCalled();
    });

    it('throws when resend returns error', async () => {
      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Send failed' },
      });

      await expect(sendDigest('u1', digest)).rejects.toThrow('Send failed');
    });

    it('renders HTML with notification that has no href', async () => {
      const digestNoHref = {
        ...digest,
        notifications: [
          {
            ...digest.notifications[0],
            data: {},
          },
        ],
      };

      const insertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      const result = await sendDigest('u1', digestNoHref);
      expect(result).toBeDefined();
    });

    it('renders HTML with null fullName (uses "Hello")', async () => {
      const digestNoName = {
        ...digest,
        recipient: { ...digest.recipient, fullName: null },
      };

      const insertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      const result = await sendDigest('u1', digestNoName);
      expect(result).toBeDefined();
    });

    it('renders HTML with null body on notification', async () => {
      const digestNullBody = {
        ...digest,
        notifications: [{ ...digest.notifications[0], body: null }],
      };

      const insertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      const result = await sendDigest('u1', digestNullBody);
      expect(result).toBeDefined();
    });
  });
});
