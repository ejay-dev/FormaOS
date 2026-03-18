const mockSend = jest.fn();
const mockGetResendClient = jest.fn();
const mockGetFromEmail = jest.fn();

jest.mock('@/lib/email/resend-client', () => ({
  getResendClient: () => mockGetResendClient(),
  getFromEmail: () => mockGetFromEmail(),
}));

import { sendAuthEmail } from '@/lib/email/send-auth-email';

describe('sendAuthEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFromEmail.mockReturnValue('onboarding@formaos.com.au');
    mockSend.mockResolvedValue({
      data: { id: 're_mocked_id' },
      error: null,
    });
    mockGetResendClient.mockReturnValue({
      emails: {
        send: mockSend,
      },
    });
  });

  it('returns configuration error when resend client is not available', async () => {
    mockGetResendClient.mockReturnValueOnce(null);

    const result = await sendAuthEmail({
      to: 'user@formaos.test',
      template: 'confirm-signup',
      actionLink: 'https://app.formaos.com.au/auth/callback?code=abc',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('resend_not_configured');
  });

  it('sends confirmation email with branded HTML payload', async () => {
    const result = await sendAuthEmail({
      to: 'user@formaos.test',
      template: 'confirm-signup',
      actionLink: 'https://app.formaos.com.au/auth/callback?code=abc',
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@formaos.com.au',
        to: 'user@formaos.test',
        subject: expect.stringContaining('Confirm'),
        html: expect.stringContaining('FormaOS'),
      }),
    );
  });

  it('sends OTP template when requested', async () => {
    await sendAuthEmail({
      to: 'user@formaos.test',
      template: 'email-otp',
      code: '912038',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('verification code'),
        html: expect.stringContaining('912038'),
      }),
    );
  });
});
