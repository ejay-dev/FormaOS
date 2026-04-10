import { brand } from '@/config/brand';

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

type AdminClient = { from: (table: string) => any };

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

function buildEmailHtml(
  type: BillingEmailType,
  context: BillingEmailContext,
): string {
  const appUrl = (brand.seo.appUrl || brand.seo.siteUrl).replace(/\/$/, '');
  const billingUrl = `${appUrl}/app/billing`;
  const appName = escapeHtml(brand.appName);

  const shell = (body: string) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;background:#0f172a;font-family:Inter,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:12px;overflow:hidden;">
<div style="padding:24px 32px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e293b);border-bottom:1px solid rgba(34,211,238,0.2);">
<div style="color:#22d3ee;font-size:24px;font-weight:800;">${appName}</div>
</div>
<div style="padding:32px;">${body}</div>
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
          <p style="color:#e2e8f0;font-size:14px;margin:4px 0;">Starter — $159/mo</p>
          <p style="color:#e2e8f0;font-size:14px;margin:4px 0;">Professional — $239/mo</p>
          <p style="color:#e2e8f0;font-size:14px;margin:4px 0;">Enterprise — $399/mo</p>
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

/**
 * Send a billing-related email to an organisation's owner/admins.
 * Queues to the email_queue table for async delivery.
 */
export async function sendBillingEmail(
  admin: AdminClient,
  orgId: string,
  type: BillingEmailType,
  context: BillingEmailContext = {},
): Promise<void> {
  try {
    const subject = EMAIL_SUBJECTS[type];
    const html = buildEmailHtml(type, context);

    // Find the org owner email
    const { data: member } = await admin
      .from('org_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .limit(1);

    const ownerMember = (
      member as unknown as Array<{ user_id: string }> | null
    )?.[0];
    if (!ownerMember) return;

    // Queue the email for delivery
    await admin.from('email_queue').insert({
      to: ownerMember.user_id,
      subject,
      template: type,
      data: { orgId, type, html, ...context },
    });
  } catch (error) {
    // Billing email failures should not break webhook processing
    console.error(
      `[billing-email] Failed to queue ${type} email for org ${orgId}:`,
      error,
    );
  }
}
