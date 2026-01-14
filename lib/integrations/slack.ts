/**
 * =========================================================
 * Slack Integration
 * =========================================================
 * Send notifications to Slack channels and users
 */

import { createClient } from '@/lib/supabase/server';

export interface SlackConfig {
  organizationId: string;
  webhookUrl: string;
  channel?: string;
  enabled: boolean;
  events: SlackEventType[];
}

export type SlackEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'member_added'
  | 'evidence_uploaded'
  | 'workflow_triggered'
  | 'compliance_alert';

export interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

/**
 * Send message to Slack
 */
export async function sendSlackMessage(
  organizationId: string,
  message: SlackMessage,
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSlackConfig(organizationId);

    if (!config || !config.enabled || !config.webhookUrl) {
      return { success: false, error: 'Slack integration not configured' };
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...message,
        channel: message.channel || config.channel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    // Log integration event
    await logSlackEvent(organizationId, 'message_sent', { message });

    return { success: true };
  } catch (error) {
    console.error('Slack integration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send task notification to Slack
 */
export async function sendTaskNotification(
  organizationId: string,
  task: {
    id: string;
    title: string;
    status: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  },
  eventType: 'created' | 'completed' | 'overdue',
): Promise<void> {
  const config = await getSlackConfig(organizationId);

  if (!config?.enabled || !config.events.includes(`task_${eventType}`)) {
    return;
  }

  const emoji = {
    created: ':new:',
    completed: ':white_check_mark:',
    overdue: ':warning:',
  }[eventType];

  const color = {
    created: '#3498db',
    completed: '#2ecc71',
    overdue: '#e74c3c',
  }[eventType];

  const message: SlackMessage = {
    text: `Task ${eventType}: ${task.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Task ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Task:*\n${task.title}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${task.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${task.priority || 'Normal'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Assigned:*\n${task.assignedTo || 'Unassigned'}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color,
        footer: 'FormaOS Compliance Manager',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  if (task.dueDate && eventType === 'overdue') {
    message.blocks!.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `⏰ Was due: ${new Date(task.dueDate).toLocaleDateString()}`,
        },
      ],
    });
  }

  await sendSlackMessage(organizationId, message);
}

/**
 * Send certificate notification to Slack
 */
export async function sendCertificateNotification(
  organizationId: string,
  certificate: {
    id: string;
    name: string;
    expiryDate: string;
    status: string;
    daysUntilExpiry?: number;
  },
  eventType: 'expiring' | 'expired',
): Promise<void> {
  const config = await getSlackConfig(organizationId);

  if (!config?.enabled || !config.events.includes(`certificate_${eventType}`)) {
    return;
  }

  const emoji = eventType === 'expiring' ? ':warning:' : ':x:';
  const color = eventType === 'expiring' ? '#f39c12' : '#e74c3c';

  const message: SlackMessage = {
    text: `Certificate ${eventType}: ${certificate.name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Certificate ${eventType === 'expiring' ? 'Expiring Soon' : 'Expired'}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Certificate:*\n${certificate.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Expiry Date:*\n${new Date(certificate.expiryDate).toLocaleDateString()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${certificate.status}`,
          },
          {
            type: 'mrkdwn',
            text: `*Days Remaining:*\n${certificate.daysUntilExpiry || 0} days`,
          },
        ],
      },
    ],
    attachments: [
      {
        color,
        footer: 'FormaOS Compliance Manager',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  await sendSlackMessage(organizationId, message);
}

/**
 * Send compliance alert to Slack
 */
export async function sendComplianceAlert(
  organizationId: string,
  alert: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired?: string;
  },
): Promise<void> {
  const config = await getSlackConfig(organizationId);

  if (!config?.enabled || !config.events.includes('compliance_alert')) {
    return;
  }

  const emoji = {
    low: ':information_source:',
    medium: ':warning:',
    high: ':exclamation:',
    critical: ':rotating_light:',
  }[alert.severity];

  const color = {
    low: '#3498db',
    medium: '#f39c12',
    high: '#e67e22',
    critical: '#e74c3c',
  }[alert.severity];

  const message: SlackMessage = {
    text: `Compliance Alert: ${alert.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${alert.severity.toUpperCase()} Alert`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.title}*\n${alert.description}`,
        },
      },
    ],
    attachments: [
      {
        color,
        footer: 'FormaOS Compliance Manager',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  if (alert.actionRequired) {
    message.blocks!.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Action Required:*\n${alert.actionRequired}`,
      },
    });
  }

  await sendSlackMessage(organizationId, message);
}

/**
 * Send team member notification
 */
export async function sendMemberNotification(
  organizationId: string,
  member: {
    name: string;
    email: string;
    role: string;
  },
  eventType: 'added' | 'removed',
): Promise<void> {
  const config = await getSlackConfig(organizationId);

  if (!config?.enabled || !config.events.includes('member_added')) {
    return;
  }

  const emoji = eventType === 'added' ? ':wave:' : ':door:';

  const message: SlackMessage = {
    text: `Team member ${eventType}: ${member.name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${member.name}* has been ${eventType} ${eventType === 'added' ? 'to' : 'from'} the team as ${member.role}`,
        },
      },
    ],
  };

  await sendSlackMessage(organizationId, message);
}

/**
 * Test Slack integration
 */
export async function testSlackIntegration(webhookUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '✅ FormaOS integration test successful!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*FormaOS* is now connected to your Slack workspace! 🎉',
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Slack configuration for organization
 */
export async function getSlackConfig(
  organizationId: string,
): Promise<SlackConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', 'slack')
    .single();

  if (error || !data) return null;

  return {
    organizationId: data.organization_id,
    webhookUrl: data.webhook_url,
    channel: data.config?.channel,
    enabled: data.enabled,
    events: data.config?.events || [],
  };
}

/**
 * Save Slack configuration
 */
export async function saveSlackConfig(config: SlackConfig): Promise<void> {
  const supabase = await createClient();

  await supabase.from('integration_configs').upsert(
    {
      organization_id: config.organizationId,
      provider: 'slack',
      webhook_url: config.webhookUrl,
      enabled: config.enabled,
      config: {
        channel: config.channel,
        events: config.events,
      },
    },
    {
      onConflict: 'organization_id,provider',
    },
  );
}

/**
 * Disable Slack integration
 */
export async function disableSlackIntegration(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('integration_configs')
    .update({ enabled: false })
    .eq('organization_id', organizationId)
    .eq('provider', 'slack');
}

/**
 * Log Slack integration event
 */
async function logSlackEvent(
  organizationId: string,
  eventType: string,
  metadata: Record<string, any>,
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('integration_events').insert({
    organization_id: organizationId,
    provider: 'slack',
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString(),
  });
}

/**
 * Get Slack integration statistics
 */
export async function getSlackStats(
  organizationId: string,
  days = 30,
): Promise<{
  totalMessages: number;
  messagesByType: Record<string, number>;
  lastMessageAt?: string;
}> {
  const supabase = await createClient();

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from('integration_events')
    .select('event_type, created_at')
    .eq('organization_id', organizationId)
    .eq('provider', 'slack')
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { totalMessages: 0, messagesByType: {} };
  }

  const messagesByType: Record<string, number> = {};
  data.forEach((event) => {
    messagesByType[event.event_type] =
      (messagesByType[event.event_type] || 0) + 1;
  });

  return {
    totalMessages: data.length,
    messagesByType,
    lastMessageAt: data[0]?.created_at,
  };
}
