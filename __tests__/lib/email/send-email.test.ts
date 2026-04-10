/** @jest-environment node */

jest.mock('@/lib/email/resend-client', () => ({
  getResendClient: jest.fn(),
  getFromEmail: jest.fn().mockReturnValue('no-reply@formaos.com.au'),
}));

jest.mock('@/lib/email/email-log-compat', () => ({
  recordEmailLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  apiLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockMaybeSingle = jest
  .fn()
  .mockResolvedValue({ data: null, error: null });
const mockFilter = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
const mockSelect = jest.fn().mockReturnValue({ filter: mockFilter });
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    from: () => ({ select: mockSelect }),
  }),
}));

jest.mock('server-only', () => ({}));

import { sendEmail, type EmailData } from '@/lib/email/send-email';
import { getResendClient } from '@/lib/email/resend-client';
import { recordEmailLog } from '@/lib/email/email-log-compat';

describe('lib/email/send-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('sendEmail — welcome', () => {
    const welcomeData: EmailData = {
      type: 'welcome',
      to: 'user@test.com',
      userName: 'Test User',
      organizationName: 'Test Org',
      organizationId: 'org-1',
      userId: 'u-1',
    };

    it('sends welcome email successfully', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'resend-1' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail(welcomeData);
      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          from: 'no-reply@formaos.com.au',
        }),
      );
      expect(recordEmailLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent', emailType: 'welcome' }),
      );
    });

    it('sends welcome email with custom loginUrl', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-2' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        ...welcomeData,
        loginUrl: 'https://app.test/custom',
      });
      expect(result.success).toBe(true);
    });

    it('returns error when Resend not configured', async () => {
      (getResendClient as jest.Mock).mockReturnValue(null);
      const result = await sendEmail(welcomeData);
      expect(result.success).toBe(false);
    });

    it('returns error when Resend returns error', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'API error' } });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail(welcomeData);
      expect(result.success).toBe(false);
    });
  });

  describe('sendEmail — invite', () => {
    const inviteData: EmailData = {
      type: 'invite',
      to: 'invite@test.com',
      inviterName: 'Admin',
      inviterEmail: 'admin@test.com',
      organizationName: 'Acme Corp',
      inviteUrl: 'https://app.test/join/abc',
      role: 'member',
    };

    it('sends invite email successfully', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-3' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail(inviteData);
      expect(result.success).toBe(true);
    });
  });

  describe('sendEmail — alert', () => {
    it('sends critical alert email', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-4' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        type: 'alert',
        to: 'admin@test.com',
        userName: 'Admin',
        alertType: 'critical',
        alertTitle: 'Security Alert',
        alertMessage: 'Suspicious login detected',
        actionUrl: 'https://app.test/security',
        actionText: 'Review Now',
      });
      expect(result.success).toBe(true);
    });

    it('sends warning alert email', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-5' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        type: 'alert',
        to: 'admin@test.com',
        userName: 'Admin',
        alertType: 'warning',
        alertTitle: 'Cert Expiring',
        alertMessage: 'SSL cert expires in 7 days',
      });
      expect(result.success).toBe(true);
    });

    it('sends info alert email', async () => {
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-6' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        type: 'alert',
        to: 'admin@test.com',
        userName: 'Admin',
        alertType: 'info',
        alertTitle: 'New Member',
        alertMessage: 'A new member joined your org',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendEmail — preference opt-out', () => {
    it('blocks email when user has unsubscribed_all', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { unsubscribed_all: true },
        error: null,
      });

      const result = await sendEmail({
        type: 'welcome',
        to: 'opted-out@test.com',
        userName: 'User',
        organizationName: 'Org',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('OPTED_OUT');
    });

    it('blocks when welcome_emails is false', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { unsubscribed_all: false, welcome_emails: false },
        error: null,
      });

      const result = await sendEmail({
        type: 'welcome',
        to: 'user@test.com',
        userName: 'User',
        organizationName: 'Org',
      });
      expect(result.success).toBe(false);
    });

    it('blocks when invitation_emails is false', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { unsubscribed_all: false, invitation_emails: false },
        error: null,
      });

      const result = await sendEmail({
        type: 'invite',
        to: 'user@test.com',
        inviterName: 'A',
        inviterEmail: 'a@test.com',
        organizationName: 'Org',
        inviteUrl: 'https://test.com/join',
        role: 'member',
      });
      expect(result.success).toBe(false);
    });

    it('blocks when alert_emails is false', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: { unsubscribed_all: false, alert_emails: false },
        error: null,
      });

      const result = await sendEmail({
        type: 'alert',
        to: 'user@test.com',
        userName: 'User',
        alertType: 'info',
        alertTitle: 'Test',
        alertMessage: 'Test message',
      });
      expect(result.success).toBe(false);
    });

    it('allows email when preferences not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-7' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        type: 'welcome',
        to: 'new@test.com',
        userName: 'New',
        organizationName: 'Org',
      });
      expect(result.success).toBe(true);
    });

    it('allows email when preference check fails', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });
      const mockSend = jest
        .fn()
        .mockResolvedValue({ data: { id: 'r-8' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({
        emails: { send: mockSend },
      });

      const result = await sendEmail({
        type: 'welcome',
        to: 'user@test.com',
        userName: 'User',
        organizationName: 'Org',
      });
      expect(result.success).toBe(true);
    });
  });
});
