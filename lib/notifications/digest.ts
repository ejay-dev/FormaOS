import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { brand } from '@/config/brand';
import { getFromEmail, getResendClient } from '@/lib/email/resend-client';
import type {
  NotificationDigestFrequency,
  NotificationRecord,
} from './types';

export interface DigestRecipientContext {
  userId: string;
  orgId: string;
  email: string;
  fullName: string | null;
  timezone: string;
}

export interface NotificationDigest {
  userId: string;
  orgId: string;
  frequency: NotificationDigestFrequency;
  digestKey: string;
  recipient: DigestRecipientContext;
  notifications: NotificationRecord[];
  scheduledFor: string;
}

function nowInTimezone(timeZone: string, date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
}

function partsToRecord(parts: Intl.DateTimeFormatPart[]) {
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function resolveTimezone(timezone?: string | null) {
  return timezone?.trim() || process.env.DEFAULT_TIMEZONE || 'UTC';
}

export function getDigestKey(
  frequency: NotificationDigestFrequency,
  scheduledFor: Date,
  timeZone: string,
) {
  const parts = partsToRecord(nowInTimezone(timeZone, scheduledFor));
  const y = parts.year ?? '0000';
  const m = parts.month ?? '00';
  const d = parts.day ?? '00';

  if (frequency === 'weekly') {
    return `${frequency}:${y}-${m}-${d}:week`;
  }

  if (frequency === 'hourly') {
    const hour = parts.hour ?? '00';
    return `${frequency}:${y}-${m}-${d}:${hour}`;
  }

  return `${frequency}:${y}-${m}-${d}`;
}

export function getNextDigestSchedule(
  frequency: NotificationDigestFrequency,
  timezone?: string | null,
  fromDate = new Date(),
) {
  const timeZone = resolveTimezone(timezone);

  if (frequency === 'instant' || frequency === 'never') {
    return fromDate.toISOString();
  }

  const current = partsToRecord(nowInTimezone(timeZone, fromDate));
  const year = Number(current.year);
  const month = Number(current.month);
  const day = Number(current.day);
  const hour = Number(current.hour);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return fromDate.toISOString();
  }

  if (frequency === 'hourly') {
    const next = new Date(fromDate);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    return next.toISOString();
  }

  const localTarget = new Date(Date.UTC(year, month - 1, day, 9, 0, 0));

  if (frequency === 'daily') {
    if (hour >= 9) {
      localTarget.setUTCDate(localTarget.getUTCDate() + 1);
    }

    return localTarget.toISOString();
  }

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(fromDate);
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(
    weekday,
  );
  const offsetToMonday = dayIndex <= 0 ? Math.abs(dayIndex) : 7 - dayIndex;

  if (weekday !== 'Mon' || hour >= 9) {
    localTarget.setUTCDate(localTarget.getUTCDate() + offsetToMonday + 1);
  }

  return localTarget.toISOString();
}

function renderDigestHtml(digest: NotificationDigest) {
  const items = digest.notifications
    .map((notification) => {
      const href =
        typeof notification.data?.href === 'string'
          ? notification.data.href
          : `${brand.seo.appUrl}/app`;

      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #e2e8f0;">
            <div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">
              ${notification.type}
            </div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px;">
              ${notification.title}
            </div>
            <div style="font-size:14px;color:#475569;line-height:1.6;">
              ${notification.body ?? ''}
            </div>
            <div style="margin-top:10px;">
              <a href="${href}" style="color:#0369a1;font-weight:600;text-decoration:none;">
                Open in ${brand.appName}
              </a>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="background:#f8fafc;padding:32px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#155e75 100%);color:#f8fafc;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#bae6fd;">
            ${brand.identity}
          </div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">${brand.appName} ${digest.frequency} digest</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="font-size:15px;color:#334155;margin-top:0;">
            ${digest.recipient.fullName || 'Hello'}, here is your ${digest.frequency} summary from ${brand.appName}.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            ${items}
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function queueForDigest(
  userId: string,
  notification: NotificationRecord,
  frequency: NotificationDigestFrequency,
  timezone?: string | null,
) {
  const admin = createSupabaseAdminClient();
  const scheduledFor = getNextDigestSchedule(frequency, timezone);

  const { error } = await admin.from('notification_digest_queue').upsert(
    {
      notification_id: notification.id,
      user_id: userId,
      org_id: notification.org_id,
      frequency,
      scheduled_for: scheduledFor,
      status: 'pending',
    },
    { onConflict: 'notification_id,frequency' },
  );

  if (error) {
    throw new Error(error.message);
  }

  return scheduledFor;
}

async function resolveDigestRecipient(
  userId: string,
  orgId: string,
): Promise<DigestRecipientContext | null> {
  const admin = createSupabaseAdminClient();
  const [{ data: profile }, authResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  const authUser = authResult.data.user;
  const email = authUser?.email ?? null;

  if (!email) {
    return null;
  }

  const timezone =
    (authUser?.user_metadata?.timezone as string | undefined) ??
    process.env.DEFAULT_TIMEZONE ??
    'UTC';

  return {
    userId,
    orgId,
    email,
    fullName: (profile?.full_name as string | null | undefined) ?? null,
    timezone,
  };
}

export async function generateDigest(
  userId: string,
  frequency: NotificationDigestFrequency,
) {
  const admin = createSupabaseAdminClient();

  const { data: queueRows, error } = await admin
    .from('notification_digest_queue')
    .select(
      `
      id,
      org_id,
      frequency,
      scheduled_for,
      notification:notifications (
        id,
        org_id,
        user_id,
        type,
        title,
        body,
        data,
        priority,
        read_at,
        archived_at,
        created_at
      )
    `,
    )
    .eq('user_id', userId)
    .eq('frequency', frequency)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (queueRows ?? []).filter(
    (row: any) => row.notification && !row.notification.archived_at,
  ) as Array<{
    id: string;
    org_id: string;
    frequency: NotificationDigestFrequency;
    scheduled_for: string;
    notification: NotificationRecord;
  }>;

  if (!rows.length) {
    return null;
  }

  const orgId = rows[0].org_id;
  const recipient = await resolveDigestRecipient(userId, orgId);

  if (!recipient) {
    return null;
  }

  const scheduledFor = new Date(rows[0].scheduled_for);
  const digestKey = getDigestKey(frequency, scheduledFor, recipient.timezone);

  const { data: historyRow } = await admin
    .from('notification_digest_history')
    .select('id')
    .eq('user_id', userId)
    .eq('digest_key', digestKey)
    .maybeSingle();

  if (historyRow?.id) {
    return null;
  }

  return {
    userId,
    orgId,
    frequency,
    digestKey,
    recipient,
    notifications: rows.map((row) => row.notification),
    scheduledFor: rows[0].scheduled_for,
  } satisfies NotificationDigest;
}

export async function sendDigest(
  userId: string,
  digest: NotificationDigest,
) {
  const resend = getResendClient();
  const admin = createSupabaseAdminClient();

  if (!resend) {
    throw new Error('Resend is not configured.');
  }

  const subject = `${brand.appName} ${digest.frequency} digest`;
  const html = renderDigestHtml(digest);

  const result = await resend.emails.send({
    from: getFromEmail(),
    to: digest.recipient.email,
    subject,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await admin.from('notification_digest_history').insert({
    user_id: userId,
    org_id: digest.orgId,
    frequency: digest.frequency,
    digest_key: digest.digestKey,
    notification_count: digest.notifications.length,
  });

  await admin
    .from('notification_digest_queue')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('frequency', digest.frequency)
    .eq('status', 'pending')
    .lte('scheduled_for', digest.scheduledFor);

  return result.data;
}
