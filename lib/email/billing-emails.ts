import { brand } from '@/config/brand';
import {
  buildUnsubscribeUrl,
  generateUnsubscribeToken,
} from '@/lib/email/unsubscribe-token';
import { getResendClient, getFromEmail } from '@/lib/email/resend-client';
import { billingLogger } from '@/lib/observability/structured-logger';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';

// Audit 2026-05-23: trial-expiring template hardcoded $159/$239/$399 while
// the catalog is $297/$797/$1800. Pull from the single source of truth.
const TRIAL_EMAIL_PLAN_ORDER: readonly PlanKey[] = ['basic', 'pro', 'scale'];

function renderTrialPriceRow(plan: PlanKey): string {
  const config = PLAN_CATALOG[plan];
  return `<p style="color:#e2e8f0;font-size:14px;margin:4px 0;">${escapeHtml(config.name)} — $${config.priceMonthly}/mo</p>`;
}

function buildUnsubscribePostUrl(baseUrl: string, userId: string): string {
  const token = generateUnsubscribeToken(userId);
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

type BillingEmailType =
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'payment_failed'
  | 'payment_recovered'
  | 'payment_action_required'
  | 'trial_expiring'
  | 'plan_changed';

interface BillingEmailContext {
  planName?: string;
  planKey?: string;
}

type AdminClient = {
  from: (table: string) => any;
  auth: {
    admin: {
      getUserById: (
        id: string,
      ) => Promise<{
        data: { user: { email?: string | null } | null } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const EMAIL_SUBJECTS: Record<BillingEmailType, string> = {
  subscription_created: `Welcome to ${brand.appName} — your subscription is active`,
  subscription_cancelled: `We're sorry to see you go — ${brand.appName}`,
  payment_failed: `Action required — ${brand.appName} payment failed`,
  payment_recovered: `Payment successful — ${brand.appName} access restored`,
  payment_action_required: `Action required — verify your payment for ${brand.appName}`,
  trial_expiring: `Your ${brand.appName} trial ends in 3 days`,
  plan_changed: `Your ${brand.appName} plan has been updated`,
};

function renderFooter(unsubscribeUrl: string): string {
  const safeUrl = escapeHtml(unsubscribeUrl);
  const siteUrl = escapeHtml(
    (brand.seo.siteUrl || brand.seo.appUrl || '').replace(/\/$/, ''),
  );
  return `
    <div style="border-top:1px solid rgba(148,163,184,0.15);margin-top:32px;padding-top:20px;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
      <p style="margin:0 0 8px;">
        You're receiving this because you have a ${escapeHtml(brand.appName)} subscription.
      </p>
      <p style="margin:0;">
        <a href="${safeUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe from all ${escapeHtml(brand.appName)} emails</a>
        ${siteUrl ? ` &middot; <a href="${siteUrl}" style="color:#64748b;text-decoration:underline;">${siteUrl.replace(/^https?:\/\//, '')}</a>` : ''}
      </p>
    </div>`;
}

function buildEmailHtml(
  type: BillingEmailType,
  context: BillingEmailContext,
  unsubscribeUrl: string,
): string {
  const appUrl = (brand.seo.appUrl || brand.seo.siteUrl).replace(/\/$/, '');
  const billingUrl = `${appUrl}/app/billing`;
  const appName = escapeHtml(brand.appName);
  const footer = renderFooter(unsubscribeUrl);

  const shell = (body: string) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#0f172a;font-family:Inter,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;">
<div style="padding:24px 32px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);border-bottom:1px solid rgba(34,211,238,0.2);">
<div style="color:#22d3ee;font-size:24px;font-weight:800;">${appName}</div>
</div>
<div style="padding:32px;">${body}${footer}</div>
</div></body></html>`;

  switch (type) {
    case 'subscription_created':
      return shell(`
        <h1 style="color:#f1f5f9;font-size:22px;">Your subscription is active!</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">Thank you for subscribing to ${appName}. Your compliance operating system is ready.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(appUrl)}/app" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Go to ${appName} →</a>
        </div>
        <p style="color:#475569;font-size:13px;">Questions? Reply to this email.</p>`);

    case 'subscription_cancelled':
      return shell(`
        <h1 style="color:#f1f5f9;font-size:22px;">Your subscription has been cancelled</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">We're sorry to see you go. Your data is kept for 30 days — you can reactivate anytime.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(billingUrl)}" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Reactivate ${appName} →</a>
        </div>
        <p style="color:#475569;font-size:13px;">What could we have done better? We'd love your feedback — just reply to this email.</p>`);

    case 'payment_failed':
      return shell(`
        <h1 style="color:#f87171;font-size:22px;">⚠️ Payment failed</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">We were unable to process your latest payment. You have <strong style="color:#f1f5f9;">3 days</strong> to update your payment method before access is restricted.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(billingUrl)}" style="display:inline-block;padding:14px 32px;background:#f87171;border-radius:8px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Update Payment Method →</a>
        </div>`);

    case 'payment_recovered':
      return shell(`
        <h1 style="color:#22d3ee;font-size:22px;">✅ Payment successful</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">Your payment has been successfully processed. Full access to ${appName} has been restored.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(appUrl)}/app" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Continue Using ${appName} →</a>
        </div>`);

    case 'payment_action_required':
      return shell(`
        <h1 style="color:#fb923c;font-size:22px;">🔐 Payment verification required</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">Your bank requires additional verification (3D Secure) to complete your payment.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(billingUrl)}" style="display:inline-block;padding:14px 32px;background:#fb923c;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Verify Payment →</a>
        </div>`);

    case 'trial_expiring':
      return shell(`
        <h1 style="color:#f1f5f9;font-size:22px;">Your trial ends in 3 days</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">Your ${appName} trial is about to expire. Upgrade now to keep all your compliance data and continue building your posture.</p>
        <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.15);border-radius:10px;padding:16px 20px;margin:20px 0;">
          ${TRIAL_EMAIL_PLAN_ORDER.map(renderTrialPriceRow).join('\n          ')}
        </div>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(billingUrl)}" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">Upgrade Now →</a>
        </div>`);

    case 'plan_changed':
      return shell(`
        <h1 style="color:#f1f5f9;font-size:22px;">Your plan has been updated</h1>
        <p style="color:#94a3b8;font-size:15px;line-height:1.7;">Your ${appName} plan is now <strong style="color:#22d3ee;">${escapeHtml(context.planName ?? 'Updated')}</strong>. All your data is preserved.</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(billingUrl)}" style="display:inline-block;padding:14px 32px;background:#22d3ee;border-radius:8px;color:#0f172a;font-size:15px;font-weight:700;text-decoration:none;">View Your Plan →</a>
        </div>`);
  }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Send a billing-related email to an organisation's owner/admin.
 *
 * Synchronous Resend dispatch (matching sendAuthEmail). RFC 8058
 * `List-Unsubscribe` + `List-Unsubscribe-Post` headers are attached so
 * mail clients show a one-click unsubscribe affordance.
 *
 * Errors are caught and logged via billingLogger (never thrown) — Stripe
 * webhooks must return 200 even when downstream email fails, otherwise
 * Stripe retries pile up. Once Sentry env vars are set, these failures
 * surface in the error tracker.
 */
export async function sendBillingEmail(
  admin: AdminClient,
  orgId: string,
  type: BillingEmailType,
  context: BillingEmailContext = {},
): Promise<void> {
  try {
    const subject = EMAIL_SUBJECTS[type];

    // Resolve the org owner's auth.users record for the actual email
    // address. v4-018: `.order('role', { ascending: true })` returned
    // 'admin' before 'owner' alphabetically — so payment-failed /
    // cancellation emails landed in an admin's inbox while the owner
    // (the person whose card got declined and who can update billing)
    // was kept in the dark. Pull the candidates explicitly, then pick
    // by an owner-first precedence — falling back to admin only if
    // there's no owner row.
    const { data: candidates } = await admin
      .from('org_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'admin']);

    const members =
      (candidates as Array<{ user_id: string; role: string }> | null) ?? [];
    const ownerMember =
      members.find((row) => row.role === 'owner') ??
      members.find((row) => row.role === 'admin') ??
      null;

    if (!ownerMember) {
      billingLogger.warn('billing_email_skipped_no_owner', { orgId, type });
      return;
    }

    const { data: authUser, error: authLookupError } =
      await admin.auth.admin.getUserById(ownerMember.user_id);
    if (authLookupError || !authUser?.user?.email) {
      billingLogger.warn('billing_email_skipped_no_email', {
        orgId,
        type,
        userId: ownerMember.user_id,
        error: authLookupError?.message ?? null,
      });
      return;
    }
    const recipient = authUser.user.email;

    // Per-recipient opt-out: if the user has unsubscribed_all, skip transactional
    // billing comms except for the cancelled/payment_failed/payment_action_required
    // events that are operational (CAN-SPAM transactional category).
    const transactional: BillingEmailType[] = [
      'payment_failed',
      'payment_action_required',
      'subscription_cancelled',
      'payment_recovered',
    ];
    if (!transactional.includes(type)) {
      const { data: prefs } = await admin
        .from('email_preferences')
        .select('unsubscribed_all')
        .eq('user_id', ownerMember.user_id)
        .maybeSingle();
      if (prefs?.unsubscribed_all) {
        billingLogger.info('billing_email_skipped_unsubscribed', {
          orgId,
          type,
          userId: ownerMember.user_id,
        });
        return;
      }
    }

    const appUrl = (brand.seo.appUrl || brand.seo.siteUrl).replace(/\/$/, '');
    const unsubscribeUrl = buildUnsubscribeUrl(appUrl, ownerMember.user_id);
    const unsubscribePostUrl = buildUnsubscribePostUrl(
      appUrl,
      ownerMember.user_id,
    );
    const html = buildEmailHtml(type, context, unsubscribeUrl);
    const text = htmlToPlainText(html);

    const resend = getResendClient();
    if (!resend) {
      billingLogger.error(
        'billing_email_resend_not_configured',
        { code: 'RESEND_NOT_CONFIGURED', message: 'RESEND_API_KEY not set' },
        { orgId, type, recipient },
      );
      return;
    }

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: recipient,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <${unsubscribePostUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (result.error) {
      billingLogger.error(
        'billing_email_send_failed',
        { code: 'RESEND_ERROR', message: result.error.message },
        { orgId, type, recipient },
      );
      return;
    }

    billingLogger.info('billing_email_sent', {
      orgId,
      type,
      recipient,
      resendId: result.data?.id ?? null,
    });
  } catch (error) {
    billingLogger.error(
      'billing_email_unexpected_error',
      {
        code: 'BILLING_EMAIL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
      { orgId, type },
    );
  }
}
