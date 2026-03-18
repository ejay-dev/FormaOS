import 'server-only';

import { sendSlackMessage } from '@/lib/integrations/slack';
import type {
  NotificationChannelRow,
  NotificationEvent,
  NotificationRecord,
  NotificationUserContext,
} from '../types';

export async function deliverSlackNotification(options: {
  recipient: NotificationUserContext;
  channel: NotificationChannelRow | null;
  notification: NotificationRecord;
  event: NotificationEvent;
}) {
  const { recipient, channel, notification, event } = options;

  if (!channel?.verified) {
    return { delivered: false, reason: 'channel_unverified' as const };
  }

  const slackChannel =
    typeof channel.config?.slack_channel === 'string'
      ? channel.config.slack_channel
      : undefined;

  const result = await sendSlackMessage(recipient.orgId, {
    channel: slackChannel,
    text: `${event.title}: ${event.body}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: event.title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: event.body,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Recipient: ${recipient.email ?? recipient.userId} • Priority: ${notification.priority}`,
          },
        ],
      },
    ],
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Slack delivery failed');
  }

  return { delivered: true };
}
