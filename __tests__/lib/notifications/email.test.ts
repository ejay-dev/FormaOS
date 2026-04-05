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

const mockSend = jest.fn();
jest.mock('@/lib/email/resend-client', () => ({
  getResendClient: jest.fn(() => ({
    emails: { send: (...args: any[]) => mockSend(...args) },
  })),
  getFromEmail: jest.fn(() => 'noreply@formaos.com'),
}));

jest.mock('@/lib/analytics', () => ({
  getComplianceMetrics: jest.fn().mockResolvedValue({
    totalCertificates: 10,
    activeCertificates: 8,
    expiringSoon: 1,
    expiredCertificates: 1,
    completionRate: 85,
  }),
  getTeamMetrics: jest.fn().mockResolvedValue({
    totalMembers: 5,
    activeMembers: 4,
    topPerformers: [
      { email: 'a@b.com', completedTasks: 5, complianceRate: 90 },
    ],
  }),
  getComplianceTrend: jest.fn().mockResolvedValue([]),
  calculateRiskScore: jest.fn().mockResolvedValue({ overall: 40 }),
}));

jest.mock('@/lib/supabase/server', () => {
  const c: Record<string, any> = {
    from: jest.fn(() => createBuilder()),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
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
  sendEmail,
  getEmailPreferences,
  updateEmailPreferences,
  scheduleWeeklyDigest,
  getEmailStats,
} from '@/lib/notifications/email';

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('email notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  /* ---------- sendEmail ---------- */
  describe('sendEmail', () => {
    it('sends task_assignment email successfully', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Task Assigned',
        template: 'task_assignment',
        data: {
          taskTitle: 'Review SOC2',
          taskDescription: 'Review the SOC2 controls',
          dueDate: '2025-06-01',
          priority: 'high',
          assignedBy: 'Admin',
          orgName: 'Test Org',
          taskUrl: 'https://app.test/tasks/1',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('sends certificate_expiring email successfully', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Cert Expiring',
        template: 'certificate_expiring',
        data: {
          certificateName: 'ISO 27001',
          expiryDate: '2025-07-01',
          daysRemaining: 15,
          orgName: 'Test Org',
          certificateUrl: 'https://app.test/certs/1',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(true);
    });

    it('sends compliance_alert email successfully', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Alert',
        template: 'compliance_alert',
        data: {
          alertTitle: 'Control Failure',
          alertDescription: 'Access control failed',
          severity: 'high',
          recommendations: ['Fix access control', 'Review logs'],
          orgName: 'Test Org',
          dashboardUrl: 'https://app.test/dashboard',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(true);
    });

    it('sends weekly_digest email successfully', async () => {
      getClient().from.mockImplementation(() => createBuilder());
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Weekly Digest',
        template: 'weekly_digest',
        data: {
          userName: 'Alice',
          orgName: 'Test Org',
          weekStart: '2025-01-01',
          weekEnd: '2025-01-07',
          stats: {
            tasksCompleted: 5,
            tasksPending: 3,
            certificatesRenewed: 0,
            certificatesExpiring: 1,
            evidenceUploaded: 2,
            riskScore: 40,
          },
          topTasks: [{ title: 'Task A', dueDate: '2025-01-10' }],
          dashboardUrl: 'https://app.test/dashboard',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(true);
    });

    it('returns false for unknown template', async () => {
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Test',
        template: 'nonexistent' as any,
        data: {},
        organizationId: 'org-1',
      });
      expect(result).toBe(false);
    });

    it('returns false when Resend is not configured', async () => {
      const { getResendClient } = require('@/lib/email/resend-client');
      getResendClient.mockReturnValueOnce(null);
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Test',
        template: 'task_assignment',
        data: {
          taskTitle: 'T',
          taskDescription: 'D',
          dueDate: '2025-06-01',
          priority: 'low',
          assignedBy: 'Admin',
          orgName: 'Org',
          taskUrl: 'http://x',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(false);
    });

    it('returns false and logs error on send failure', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'send failed' },
      });
      const result = await sendEmail({
        to: ['user@test.com'],
        subject: 'Test',
        template: 'task_assignment',
        data: {
          taskTitle: 'T',
          taskDescription: 'D',
          dueDate: '2025-06-01',
          priority: 'low',
          assignedBy: 'Admin',
          orgName: 'Org',
          taskUrl: 'http://x',
        },
        organizationId: 'org-1',
      });
      expect(result).toBe(false);
    });
  });

  /* ---------- getEmailPreferences ---------- */
  describe('getEmailPreferences', () => {
    it('returns preferences when found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            user_id: 'u1',
            organization_id: 'org-1',
            enabled: true,
            frequency: 'immediate',
            enabledEvents: ['task_assignment'],
          },
        }),
      );
      const prefs = await getEmailPreferences('u1', 'org-1');
      expect(prefs).not.toBeNull();
      expect(prefs!.enabled).toBe(true);
    });

    it('returns null when not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'not found' } }),
      );
      const prefs = await getEmailPreferences('u1', 'org-1');
      expect(prefs).toBeNull();
    });
  });

  /* ---------- updateEmailPreferences ---------- */
  describe('updateEmailPreferences', () => {
    it('updates existing preferences', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'pref-1' } }),
      );
      await expect(
        updateEmailPreferences('u1', 'org-1', { enabled: false }),
      ).resolves.not.toThrow();
    });

    it('inserts new preferences when none exist', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      await expect(
        updateEmailPreferences('u1', 'org-1', {
          enabled: true,
          frequency: 'daily_digest',
        }),
      ).resolves.not.toThrow();
    });
  });

  /* ---------- scheduleWeeklyDigest ---------- */
  describe('scheduleWeeklyDigest', () => {
    it('sends digest to users with weekly preference', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'email_preferences')
          return createBuilder({
            data: [
              {
                user_id: 'u1',
                profiles: { email: 'u@test.com', full_name: 'User' },
              },
            ],
          });
        if (table === 'organizations')
          return createBuilder({ data: { name: 'Test Org' } });
        if (table === 'tasks')
          return createBuilder({
            data: [{ status: 'completed', due_date: '2025-01-08' }],
          });
        if (table === 'certifications') return createBuilder({ data: [] });
        if (table === 'org_evidence') return createBuilder({ data: [] });
        if (table === 'risk_analyses')
          return createBuilder({ data: { overall_risk_score: 30 } });
        return createBuilder();
      });

      await scheduleWeeklyDigest('org-1');
      expect(mockSend).toHaveBeenCalled();
    });

    it('does nothing when no users have weekly digest', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: [] }));
      await scheduleWeeklyDigest('org-1');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  /* ---------- getEmailStats ---------- */
  describe('getEmailStats', () => {
    it('returns statistics from email logs', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: [
            { template: 'task_assignment', status: 'sent' },
            { template: 'task_assignment', status: 'sent' },
            { template: 'compliance_alert', status: 'failed' },
          ],
        }),
      );
      const stats = await getEmailStats('org-1');
      expect(stats.totalSent).toBe(3);
      expect(stats.deliveryRate).toBe(67);
      expect(stats.byTemplate.task_assignment).toBe(2);
    });

    it('returns zeros when no logs', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const stats = await getEmailStats('org-1');
      expect(stats.totalSent).toBe(0);
      expect(stats.deliveryRate).toBe(0);
    });
  });
});
