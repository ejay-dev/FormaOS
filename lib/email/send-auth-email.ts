import { brand } from '@/config/brand';
import { getFromEmail, getResendClient } from '@/lib/email/resend-client';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@formaos.com.au';

export type AuthEmailTemplate =
  | 'confirm-signup'
  | 'magic-link'
  | 'password-reset'
  | 'change-email'
  | 'invite'
  | 'email-otp'
  | 'reauthentication';

type AuthEmailInput = {
  to: string;
  template: AuthEmailTemplate;
  actionLink?: string;
  code?: string;
  organizationName?: string;
  invitedByName?: string;
  newEmail?: string;
};

type AuthEmailContent = {
  subject: string;
  preheader: string;
  badge: string;
  title: string;
  intro: string;
  actionLabel?: string;
  actionLink?: string;
  code?: string;
  details: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderDetails(items: string[]): string {
  if (!items.length) return '';
  return `
    <ul style="margin:0;padding-left:20px;color:#4b5563;line-height:1.7;">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
    </ul>
  `;
}

function renderActionBlock(
  label: string | undefined,
  actionLink: string | undefined,
): string {
  if (!label || !actionLink) return '';
  return `
    <div style="margin:22px 0;">
      <a
        href="${escapeHtml(actionLink)}"
        target="_blank"
        rel="noopener"
        style="display:inline-block;background:#0f766e;color:#ffffff !important;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;letter-spacing:0.2px;"
      >${escapeHtml(label)}</a>
    </div>
    <p style="margin:0 0 10px;color:#6b7280;font-size:12px;">If the button does not work, use this secure link:</p>
    <p style="margin:0;color:#6b7280;font-size:12px;word-break:break-all;">${escapeHtml(actionLink)}</p>
  `;
}

function renderCodeBlock(code: string | undefined): string {
  if (!code) return '';
  return `
    <div style="margin:20px 0 6px;">
      <div style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:10px 14px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;font-size:18px;font-weight:700;letter-spacing:2px;color:#0f172a;">
        ${escapeHtml(code)}
      </div>
    </div>
  `;
}

function buildContent(input: AuthEmailInput): AuthEmailContent {
  const appName = brand.appName;
  const organizationName = input.organizationName || 'your organization';
  const invitedByName = input.invitedByName || 'a team administrator';

  switch (input.template) {
    case 'confirm-signup':
      return {
        subject: `Confirm your ${appName} account`,
        preheader: 'Confirm your email to complete account setup.',
        badge: 'Action required',
        title: 'Confirm your email to finish setup',
        intro:
          'You are one step away from your compliance workspace. Confirm your email to complete account setup.',
        actionLabel: 'Confirm email',
        actionLink: input.actionLink,
        details: [
          'Your trial workspace is created after confirmation.',
          'You can complete onboarding and invite your team immediately.',
        ],
      };
    case 'magic-link':
      return {
        subject: `Your secure sign-in link for ${appName}`,
        preheader: 'Use this one-time link to sign in.',
        badge: 'Secure access',
        title: 'Sign in with your secure link',
        intro:
          'Use this one-time magic link to sign in. The link expires shortly for security.',
        actionLabel: 'Sign in securely',
        actionLink: input.actionLink,
        details: [
          'The link can be used once.',
          'If you did not request this, ignore this email.',
        ],
      };
    case 'password-reset':
      return {
        subject: `Reset your ${appName} password`,
        preheader: 'Use this link to reset your password.',
        badge: 'Security',
        title: 'Reset your password',
        intro:
          'We received a password reset request for your account. Use the link below to set a new password.',
        actionLabel: 'Reset password',
        actionLink: input.actionLink,
        details: [
          'Choose a strong, unique password.',
          'If you did not request this, ignore this email.',
        ],
      };
    case 'change-email':
      return {
        subject: `Confirm your new email for ${appName}`,
        preheader: 'Confirm your new email address.',
        badge: 'Account update',
        title: 'Confirm your new email',
        intro: input.newEmail
          ? `Confirm your new email address: ${input.newEmail}.`
          : 'Confirm your new email address to complete the update.',
        actionLabel: 'Confirm new email',
        actionLink: input.actionLink,
        details: [
          'After confirmation, all account notifications use your new email.',
          'If you did not request this, contact support immediately.',
        ],
      };
    case 'invite':
      return {
        subject: `${invitedByName} invited you to ${organizationName} on ${appName}`,
        preheader: 'Accept your invitation and join your team workspace.',
        badge: 'Team invitation',
        title: `You are invited to ${organizationName}`,
        intro: `${invitedByName} invited you to collaborate in ${appName}.`,
        actionLabel: 'Accept invitation',
        actionLink: input.actionLink,
        details: [
          'Join shared controls, tasks, and audit evidence.',
          'Invitation links expire automatically for security.',
        ],
      };
    case 'email-otp':
      return {
        subject: `Your ${appName} verification code`,
        preheader: 'Use this one-time verification code.',
        badge: 'Verification code',
        title: 'Your one-time verification code',
        intro: 'Enter this code to complete your authentication request.',
        code: input.code,
        details: [
          'This code expires quickly.',
          'Never share this code with anyone.',
        ],
      };
    case 'reauthentication':
      return {
        subject: `${appName} reauthentication required`,
        preheader: 'Reauthenticate to continue your secure action.',
        badge: 'Security check',
        title: 'Confirm this sensitive action',
        intro:
          'Please reauthenticate before completing this sensitive account action.',
        actionLabel: 'Reauthenticate',
        actionLink: input.actionLink,
        code: input.code,
        details: [
          'This request protects your account from unauthorized changes.',
          'If you did not initiate this action, ignore this email.',
        ],
      };
    default:
      return {
        subject: `${appName} account notification`,
        preheader: 'Important account notification.',
        badge: 'Notification',
        title: 'Account notification',
        intro: 'There is an update for your account.',
        details: [],
      };
  }
}

function renderHtml(content: AuthEmailContent): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-preheader" content="${escapeHtml(content.preheader)}" />
    <title>${escapeHtml(content.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
    <div style="max-width:640px;margin:0 auto;padding:36px 20px;">
      <div style="background:#0f172a;border-radius:14px 14px 0 0;padding:18px 24px;">
        <img
          src="https://app.formaos.com.au/brand/formaos-wordmark-light.svg"
          width="164"
          height="30"
          alt="FormaOS"
          style="display:block"
        />
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:26px 24px 24px;">
        <div style="display:inline-block;background:#ecfeff;color:#155e75;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;letter-spacing:0.2px;">${escapeHtml(content.badge)}</div>
        <h1 style="margin:14px 0 10px;font-size:24px;line-height:1.3;color:#0f172a;">${escapeHtml(content.title)}</h1>
        <p style="margin:0 0 16px;color:#374151;line-height:1.7;">${escapeHtml(content.intro)}</p>
        ${renderActionBlock(content.actionLabel, content.actionLink)}
        ${renderCodeBlock(content.code)}
        ${renderDetails(content.details)}
        <div style="height:1px;background:#e5e7eb;margin:20px 0;"></div>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;">
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
            Security notice: FormaOS staff will never ask for your password or one-time code. If this request was not initiated by you, contact <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f766e;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.
          </p>
        </div>
      </div>
      <p style="margin:14px 0 0;text-align:center;font-size:12px;color:#94a3b8;">
        ${escapeHtml(brand.appName)} &middot; Compliance Operating System
      </p>
    </div>
  </body>
</html>`;
}

function renderText(content: AuthEmailContent): string {
  const details =
    content.details.length > 0
      ? `\n- ${content.details.join('\n- ')}`
      : '';
  const action = content.actionLink
    ? `\n${content.actionLabel || 'Action link'}: ${content.actionLink}`
    : '';
  const code = content.code ? `\nVerification code: ${content.code}` : '';

  return `${content.title}

${content.intro}${action}${code}${details}

Security notice: FormaOS staff will never ask for your password or one-time code.
Support: ${SUPPORT_EMAIL}`;
}

export async function sendAuthEmail(input: AuthEmailInput): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'resend_not_configured' };
  }

  const content = buildContent(input);
  const html = renderHtml(content);
  const text = renderText(content);

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: input.to,
      subject: content.subject,
      html,
      text,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'email_send_failed',
    };
  }
}
