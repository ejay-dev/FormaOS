import 'server-only';

import { brand } from '@/config/brand';
import { getFromEmail, getResendClient } from '@/lib/email/resend-client';
import { queueForDigest } from '../digest';
import type {
  NotificationDigestFrequency,
  NotificationEvent,
  NotificationRecord,
  NotificationUserContext,
} from '../types';

function renderNotificationEmail(
  recipient: NotificationUserContext,
  event: NotificationEvent,
) {
  const href =
    typeof event.data?.href === 'string'
      ? event.data.href
      : `${brand.seo.appUrl}/app`;

  return `
    <div style="background:#eff6ff;padding:32px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#155e75 100%);color:#f8fafc;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#bae6fd;">
            ${brand.identity}
          </div>
          <h1 style="margin:10px 0 0;font-size:26px;line-height:1.1;">${event.title}</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="font-size:15px;color:#334155;margin-top:0;">
            ${recipient.fullName || 'Hello'},
          </p>
          <p style="font-size:15px;color:#334155;line-height:1.7;">
            ${event.body}
          </p>
          <div style="margin-top:24px;">
            <a href="${href}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700;">
              Open in ${brand.appName}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function deliverEmailNotification(options: {
  recipient: NotificationUserContext;
  event: NotificationEvent;
  notification: NotificationRecord;
  digestFrequency: NotificationDigestFrequency;
}) {
  const { recipient, event, notification, digestFrequency } = options;

  if (!recipient.email) {
    return { delivered: false, reason: 'missing_email' as const };
  }

  if (digestFrequency !== 'instant' && event.priority !== 'critical') {
    const scheduledFor = await queueForDigest(
      recipient.userId,
      notification,
      digestFrequency,
      recipient.timezone,
    );

    return {
      delivered: false,
      queued: true,
      scheduledFor,
    };
  }

  const resend = getResendClient();
  if (!resend) {
    throw new Error('Resend is not configured.');
  }

  const result = await resend.emails.send({
    from: getFromEmail(),
    to: recipient.email,
    subject: `${brand.appName}: ${event.title}`,
    html: renderNotificationEmail(recipient, event),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { delivered: true, id: result.data?.id ?? null };
}
