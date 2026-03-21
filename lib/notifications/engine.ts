import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createInAppNotification } from './channels/in-app';
import { deliverEmailNotification } from './channels/email';
import { deliverSlackNotification } from './channels/slack';
import { deliverTeamsNotification } from './channels/teams';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import {
  getDefaultDigestFrequency,
  type NotificationChannelRow,
  type NotificationEvent,
  type NotificationPreferenceRow,
  type NotificationRecipients,
  type NotificationUserContext,
} from './types';

const DEFAULT_DEDUPE_WINDOW_MINUTES = 20;

function logNotificationDeliveryFailure(
  channel: string,
  userId: string,
  orgId: string,
  error: unknown,
) {
  console.warn('[Notifications] delivery failed', {
    channel,
    userId,
    orgId,
    error: error instanceof Error ? error.message : 'unknown error',
  });
}

async function resolveRecipientIds(
  orgId: string,
  recipients: NotificationRecipients,
) {
  if (Array.isArray(recipients)) {
    return Array.from(new Set(recipients.filter(Boolean)));
  }

  const admin = createSupabaseAdminClient();
  let query = admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId);

  if (recipients.roles?.length) {
    query = query.in('role', recipients.roles);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const ids = new Set<string>(
    (data ?? []).map((row: any) => row.user_id).filter(Boolean),
  );

  for (const userId of recipients.userIds ?? []) {
    ids.add(userId);
  }

  return Array.from(ids);
}

async function resolveUserContext(
  orgId: string,
  userId: string,
): Promise<NotificationUserContext | null> {
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
  if (!authUser) {
    return null;
  }

  return {
    userId,
    orgId,
    email: authUser.email ?? null,
    fullName: (profile?.full_name as string | null | undefined) ?? null,
    timezone:
      (authUser.user_metadata?.timezone as string | undefined) ??
      process.env.DEFAULT_TIMEZONE ??
      'UTC',
  };
}

async function loadPreferences(
  orgId: string,
  userId: string,
  eventType: NotificationEvent['type'],
) {
  const admin = createSupabaseAdminClient();
  const [{ data: preferences }, { data: channels }] = await Promise.all([
    admin
      .from('notification_preferences')
      .select(
        'id, user_id, org_id, channel, event_type, enabled, digest_frequency, quiet_hours',
      )
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('event_type', eventType),
    admin
      .from('notification_channels')
      .select('id, user_id, org_id, channel_type, config, verified')
      .eq('org_id', orgId)
      .eq('user_id', userId),
  ]);

  return {
    preferences: (preferences ?? []) as NotificationPreferenceRow[],
    channels: (channels ?? []) as NotificationChannelRow[],
  };
}

function getPreferenceForChannel(
  preferences: NotificationPreferenceRow[],
  event: NotificationEvent,
  channel: NotificationPreferenceRow['channel'],
) {
  const row = preferences.find((preference) => preference.channel === channel);

  if (row) {
    return row;
  }

  return {
    id: `default:${channel}`,
    user_id: '',
    org_id: '',
    channel,
    event_type: event.type,
    enabled: channel === 'in_app' || channel === 'email',
    digest_frequency: getDefaultDigestFrequency(
      channel,
      event.priority ?? 'normal',
    ),
    quiet_hours: {},
  } satisfies NotificationPreferenceRow;
}

function isWithinQuietHours(
  quietHours: Record<string, unknown> | null | undefined,
  timezone: string,
) {
  const config = quietHours ?? {};
  if (!config.enabled) {
    return false;
  }

  const start =
    typeof config.start === 'string' && /^\d{2}:\d{2}$/.test(config.start)
      ? config.start
      : null;
  const end =
    typeof config.end === 'string' && /^\d{2}:\d{2}$/.test(config.end)
      ? config.end
      : null;

  if (!start || !end) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const current = formatter.format(new Date());

  if (start < end) {
    return current >= start && current <= end;
  }

  return current >= start || current <= end;
}

async function isDuplicateNotification(
  orgId: string,
  userId: string,
  event: NotificationEvent,
) {
  const admin = createSupabaseAdminClient();
  const dedupeKey =
    event.dedupeKey ??
    (typeof event.data?.dedupeKey === 'string'
      ? event.data.dedupeKey
      : undefined);

  if (!dedupeKey) {
    return false;
  }

  const windowMinutes = event.dedupeWindowMinutes ?? DEFAULT_DEDUPE_WINDOW_MINUTES;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { data, error } = await admin
    .from('notifications')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('type', event.type)
    .eq('dedupe_key', dedupeKey)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingSupabaseTableError(error, 'notifications')) {
      return false;
    }
    throw new Error(error.message);
  }

  return Boolean(data?.id);
}

export async function notify(
  orgId: string,
  recipients: NotificationRecipients,
  event: NotificationEvent,
) {
  const results: Array<{
    userId: string;
    status: 'delivered' | 'skipped';
    channels: string[];
    reason?: string;
  }> = [];

  const recipientIds = await resolveRecipientIds(orgId, recipients);

  for (const userId of recipientIds) {
    const recipient = await resolveUserContext(orgId, userId);

    if (!recipient) {
      results.push({
        userId,
        status: 'skipped',
        channels: [],
        reason: 'recipient_not_found',
      });
      continue;
    }

    if (await isDuplicateNotification(orgId, userId, event)) {
      results.push({
        userId,
        status: 'skipped',
        channels: [],
        reason: 'duplicate',
      });
      continue;
    }

    const { preferences, channels } = await loadPreferences(orgId, userId, event.type);
    const deliveredChannels: string[] = [];
    let deliveryFailed = false;

    const inAppPreference = getPreferenceForChannel(preferences, event, 'in_app');
    if (inAppPreference.enabled) {
      try {
        const notification = await createInAppNotification(recipient, event);
        deliveredChannels.push('in_app');

        const emailPreference = getPreferenceForChannel(preferences, event, 'email');
        if (emailPreference.enabled && !isWithinQuietHours(emailPreference.quiet_hours, recipient.timezone || 'UTC')) {
          try {
            await deliverEmailNotification({
              recipient,
              event,
              notification,
              digestFrequency:
                event.priority === 'critical'
                  ? 'instant'
                  : emailPreference.digest_frequency,
            });
            deliveredChannels.push('email');
          } catch (error) {
            deliveryFailed = true;
            logNotificationDeliveryFailure('email', userId, orgId, error);
          }
        } else if (emailPreference.enabled && event.priority === 'critical') {
          try {
            await deliverEmailNotification({
              recipient,
              event,
              notification,
              digestFrequency: 'instant',
            });
            deliveredChannels.push('email');
          } catch (error) {
            deliveryFailed = true;
            logNotificationDeliveryFailure('email', userId, orgId, error);
          }
        }

        const slackPreference = getPreferenceForChannel(preferences, event, 'slack');
        if (slackPreference.enabled) {
          const slackChannel =
            channels.find((channel) => channel.channel_type === 'slack') ?? null;
          try {
            await deliverSlackNotification({
              recipient,
              channel: slackChannel,
              notification,
              event,
            });
            deliveredChannels.push('slack');
          } catch (error) {
            deliveryFailed = true;
            logNotificationDeliveryFailure('slack', userId, orgId, error);
          }
        }

        const teamsPreference = getPreferenceForChannel(preferences, event, 'teams');
        if (teamsPreference.enabled) {
          const teamsChannel =
            channels.find((channel) => channel.channel_type === 'teams') ?? null;
          try {
            await deliverTeamsNotification({
              recipient,
              channel: teamsChannel,
              notification,
              event,
            });
            deliveredChannels.push('teams');
          } catch (error) {
            deliveryFailed = true;
            logNotificationDeliveryFailure('teams', userId, orgId, error);
          }
        }
      } catch (error) {
        deliveryFailed = true;
        logNotificationDeliveryFailure('in_app', userId, orgId, error);
      }
    }

    results.push({
      userId,
      status: deliveredChannels.length ? 'delivered' : 'skipped',
      channels: deliveredChannels,
      reason: deliveredChannels.length
        ? deliveryFailed
          ? 'partial_delivery_failure'
          : undefined
        : deliveryFailed
          ? 'delivery_failed'
          : 'all_channels_disabled',
    });
  }

  return {
    ok: true,
    orgId,
    eventType: event.type,
    results,
  };
}
