import 'server-only';

import { sendTeamsMessage } from '@/lib/integrations/teams';
import type {
  NotificationChannelRow,
  NotificationEvent,
  NotificationRecord,
  NotificationUserContext,
} from '../types';

export async function deliverTeamsNotification(options: {
  recipient: NotificationUserContext;
  channel: NotificationChannelRow | null;
  notification: NotificationRecord;
  event: NotificationEvent;
}) {
  const { recipient, channel, notification, event } = options;

  const webhook =
    typeof channel?.config?.teams_webhook === 'string'
      ? channel.config.teams_webhook
      : null;

  if (!channel?.verified || !webhook) {
    return { delivered: false, reason: 'channel_unverified' as const };
  }

  const success = await sendTeamsMessage(webhook, {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: event.title,
        size: 'Large',
        weight: 'Bolder',
        color: notification.priority === 'critical' ? 'Attention' : 'Accent',
      },
      {
        type: 'TextBlock',
        text: event.body,
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Recipient',
            value: recipient.email ?? recipient.userId,
          },
          {
            title: 'Priority',
            value: notification.priority,
          },
        ],
      },
    ],
    actions:
      typeof event.data?.href === 'string'
        ? [
            {
              type: 'Action.OpenUrl',
              title: 'Open in FormaOS',
              url: event.data.href,
            },
          ]
        : undefined,
  });

  if (!success) {
    throw new Error('Teams delivery failed');
  }

  return { delivered: true };
}
