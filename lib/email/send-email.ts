import { getResendClient, getFromEmail } from './resend-client';
import { recordEmailLog } from '@/lib/email/email-log-compat';
import { apiLogger } from '@/lib/observability/structured-logger';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { brand } from '@/config/brand';

export type EmailType = 'welcome' | 'invite' | 'alert';

interface BaseEmailData {
  to: string;
  type: EmailType;
  organizationId?: string;
  userId?: string;
}

interface WelcomeEmailData extends BaseEmailData {
  type: 'welcome';
  userName: string;
  organizationName: string;
  loginUrl?: string;
}

interface InviteEmailData extends BaseEmailData {
  type: 'invite';
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}

interface AlertEmailData extends BaseEmailData {
  type: 'alert';
  userName: string;
  alertType: 'info' | 'warning' | 'critical';
  alertTitle: string;
  alertMessage: string;
  actionUrl?: string;
  actionText?: string;
}

export type EmailData = WelcomeEmailData | InviteEmailData | AlertEmailData;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderEmailShell(title: string, preview: string, content: string) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;background:#0f172a;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
      <div style="margin:0 auto;max-width:600px;background:#1e293b;border-radius:12px;overflow:hidden;">
        <div style="padding:32px 40px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-bottom:1px solid rgba(34,211,238,0.2);">
          <div style="color:#22d3ee;font-size:28px;font-weight:800;letter-spacing:-0.5px;">${escapeHtml(brand.appName)}</div>
          <div style="color:#94a3b8;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-top:6px;">Compliance Operating System</div>
        </div>
        <div style="padding:36px 40px;">${content}</div>
      </div>
    </body>
  </html>`;
}

function renderInviteEmail(data: InviteEmailData) {
  const role = `${data.role.charAt(0).toUpperCase()}${data.role.slice(1)}`;
  return renderEmailShell(
    `Invitation: Join ${data.organizationName} on ${brand.appName}`,
    `You've been invited to join ${data.organizationName} on ${brand.appName}`,
    `
      <h1 style="margin:0 0 20px;color:#f1f5f9;font-size:24px;line-height:1.3;">You've been invited! 🎉</h1>
      <p style="margin:16px 0;color:#94a3b8;font-size:15px;line-height:1.7;">
        <strong style="color:#f1f5f9;">${escapeHtml(data.inviterName)}</strong>
        <span style="color:#64748b;"> (${escapeHtml(data.inviterEmail)})</span>
        has invited you to join <strong style="color:#22d3ee;">${escapeHtml(data.organizationName)}</strong> on ${escapeHtml(brand.appName)}.
      </p>
      <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.15);border-radius:10px;padding:20px 24px;margin:24px 0;">
        <div style="display:flex;justify-content:space-between;font-size:14px;margin:0 0 12px;">
          <span style="color:#64748b;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;">Organization</span>
          <span style="color:#e2e8f0;font-weight:500;">${escapeHtml(data.organizationName)}</span>
        </div>
        <div style="border-top:1px solid rgba(34,211,238,0.08);margin:12px 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;margin:0 0 12px;">
          <span style="color:#64748b;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;">Role</span>
          <span style="color:#22d3ee;font-weight:600;">${escapeHtml(role)}</span>
        </div>
        <div style="border-top:1px solid rgba(34,211,238,0.08);margin:12px 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;margin:0;">
          <span style="color:#64748b;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.08em;">Invited by</span>
          <span style="color:#e2e8f0;font-weight:500;">${escapeHtml(data.inviterName)}</span>
        </div>
      </div>
      <p style="margin:16px 0;color:#94a3b8;font-size:15px;line-height:1.7;">
        FormaOS brings governance, policies, evidence, reporting, and audit readiness into one operating system for your team.
      </p>
      <div style="margin:32px 0;text-align:center;">
        <a href="${escapeHtml(data.inviteUrl)}" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Accept Invitation →</a>
      </div>
      <p style="margin:16px 0;color:#475569;font-size:13px;line-height:1.6;">
        This invitation expires in 7 days. If you don't want to join, you can safely ignore this email.
      </p>
      <div style="border-top:1px solid rgba(34,211,238,0.1);margin:24px 0;"></div>
      <p style="color:#475569;font-size:13px;font-style:italic;margin:0;">— The FormaOS Team</p>
    `,
  );
}

function renderWelcomeEmail(data: WelcomeEmailData, appBase: string) {
  const loginUrl = data.loginUrl || `${appBase}/app`;
  const features = [
    'Governance policies and compliance frameworks',
    'Task management and compliance roadmaps',
    'Evidence collection and secure storage',
    'Tamper-proof audit trails and logs',
    'Team collaboration with role-based access',
  ];

  return renderEmailShell(
    `Welcome to ${brand.appName}, ${data.userName}!`,
    `Welcome to ${brand.appName} — your compliance journey starts now`,
    `
      <h1 style="margin:0 0 20px;color:#f1f5f9;font-size:24px;line-height:1.3;">Welcome, ${escapeHtml(data.userName)}! 🎉</h1>
      <p style="margin:16px 0;color:#94a3b8;font-size:15px;line-height:1.7;">
        Your organization <strong style="color:#22d3ee;">${escapeHtml(data.organizationName)}</strong> has been successfully created. You're all set to start your compliance journey.
      </p>
      <p style="margin:16px 0;color:#94a3b8;font-size:15px;line-height:1.7;">FormaOS helps your team manage:</p>
      <div style="margin:20px 0;">
        ${features
          .map(
            (feature) => `<p style="margin:8px 0;color:#cbd5e1;font-size:14px;line-height:1.6;"><span style="color:#22d3ee;font-weight:700;">✓</span>&nbsp;&nbsp;${escapeHtml(feature)}</p>`,
          )
          .join('')}
      </div>
      <div style="margin:32px 0;text-align:center;">
        <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Go to Dashboard →</a>
      </div>
      <div style="border-top:1px solid rgba(34,211,238,0.1);margin:24px 0;"></div>
      <p style="color:#475569;font-size:13px;font-style:italic;margin:0;">— The FormaOS Team</p>
    `,
  );
}

function renderAlertEmail(data: AlertEmailData, appBase: string) {
  const actionUrl = data.actionUrl || `${appBase}/app`;
  const actionText = data.actionText || 'View Details';
  const palette =
    data.alertType === 'critical'
      ? { bg: 'rgba(248,113,113,0.12)', border: '#f87171', btnBg: '#f87171', btnColor: '#ffffff', icon: '🚨' }
      : data.alertType === 'warning'
        ? { bg: 'rgba(251,146,60,0.12)', border: '#fb923c', btnBg: '#fb923c', btnColor: '#0f172a', icon: '⚠️' }
        : { bg: 'rgba(34,211,238,0.12)', border: '#22d3ee', btnBg: '#22d3ee', btnColor: '#0f172a', icon: 'ℹ️' };

  return renderEmailShell(
    `${brand.appName} Alert: ${data.alertTitle}`,
    data.alertTitle,
    `
      <h1 style="margin:0 0 20px;color:#f1f5f9;font-size:22px;line-height:1.3;">${palette.icon} ${escapeHtml(data.alertTitle)}</h1>
      <p style="margin:16px 0;color:#94a3b8;font-size:15px;line-height:1.7;">Hi ${escapeHtml(data.userName)},</p>
      <div style="border-left:4px solid ${palette.border};background:${palette.bg};border-radius:8px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6;font-weight:500;">${escapeHtml(data.alertMessage)}</p>
      </div>
      <div style="margin:28px 0;text-align:center;">
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 32px;background:${palette.btnBg};border-radius:8px;color:${palette.btnColor};font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(actionText)} →</a>
      </div>
      <p style="margin:16px 0;color:#475569;font-size:13px;line-height:1.6;">
        You're receiving this because you're a member of an organization on FormaOS. Manage your notification preferences in account settings.
      </p>
      <div style="border-top:1px solid rgba(34,211,238,0.1);margin:24px 0;"></div>
      <p style="color:#475569;font-size:13px;font-style:italic;margin:0;">— The FormaOS Team</p>
    `,
  );
}

/**
 * Check user email preferences before sending.
 * Enhanced to handle edge cases where user doesn't exist yet.
 */
async function checkEmailPreferences(
  email: string,
  emailType: EmailType,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    // NOTE: We look up the preferences by the user's email
    // This assumes the user already has a record in email_preferences.
    // We use a join or a subquery if user_id is unknown.
    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select(
        `
        *,
        user:user_id (
          email
        )
      `,
      )
      .filter('user.email', 'eq', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[checkEmailPreferences] DB Error:', error.message);
      return true; // Default to allowing if DB check fails
    }

    if (!prefs) return true; // No settings found (e.g. new invite), allow email
    if (prefs.unsubscribed_all) return false;

    switch (emailType) {
      case 'welcome':
        return prefs.welcome_emails;
      case 'invite':
        return prefs.invitation_emails;
      case 'alert':
        return prefs.alert_emails;
      default:
        return true;
    }
  } catch (error) {
    console.error('[checkEmailPreferences] Unexpected Error:', error);
    return true;
  }
}

/**
 * Log email status to the immutable email_logs table.
 */
async function logEmail(
  emailType: string,
  recipientEmail: string,
  subject: string,
  status: 'sent' | 'failed',
  resendId?: string,
  errorMessage?: string,
  organizationId?: string,
  userId?: string,
) {
  try {
    await recordEmailLog({
      emailType,
      recipientEmail,
      subject,
      status,
      resendId,
      errorMessage,
      organizationId,
      userId,
    });
  } catch (error) {
    console.error('[logEmail] Failed to record in ledger:', error);
  }
}

export async function sendEmail(data: EmailData) {
  try {
    const appUrl = brand.seo.appUrl || brand.seo.siteUrl;
    const appBase = appUrl.replace(/\/$/, '');

    // 1. Policy Enforcement: Check if user wants this email
    const allowed = await checkEmailPreferences(data.to, data.type);
    if (!allowed) {
      apiLogger.info('email_blocked_by_preference', {
        to: data.to,
        emailType: data.type,
      });
      return { success: false, error: 'OPTED_OUT' };
    }

    let subject = '';
    let html = '';

    // 2. Template Selection
    switch (data.type) {
      case 'welcome':
        subject = `Welcome to ${brand.appName}, ${data.userName}!`;
        html = renderWelcomeEmail(data, appBase);
        break;

      case 'invite':
        subject = `Invitation: Join ${data.organizationName} on ${brand.appName}`;
        html = renderInviteEmail(data);
        break;

      case 'alert':
        subject = `${brand.appName} Alert: ${data.alertTitle}`;
        html = renderAlertEmail(data, appBase);
        break;

      default:
        throw new Error('Invalid email type');
    }

    // 3. Execution: Send via Resend
    const resend = getResendClient();
    if (!resend) {
      throw new Error('Resend is not configured.');
    }

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject,
      html,
    });

    if (result.error) throw new Error(result.error.message);

    // 4. Traceability: Log success
    await logEmail(
      data.type,
      data.to,
      subject,
      'sent',
      result.data?.id,
      undefined,
      data.organizationId,
      data.userId,
    );

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[sendEmail] CRITICAL FAILURE:', error.message);

    // Log failure for audit purposes
    await logEmail(
      data.type,
      data.to,
      'FAILED_TO_SEND',
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown transport error',
      data.organizationId,
      data.userId,
    );

    return { success: false, error: error.message };
  }
}
