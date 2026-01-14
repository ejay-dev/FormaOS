/**
 * =========================================================
 * Microsoft Teams Integration
 * =========================================================
 * Send notifications and updates to Microsoft Teams channels
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';

export type TeamsEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'certificate_renewed'
  | 'compliance_alert'
  | 'risk_analysis_complete'
  | 'evidence_uploaded'
  | 'member_added'
  | 'workflow_triggered';

export interface TeamsConfig {
  webhookUrl: string;
  channelName: string;
  enabledEvents: TeamsEventType[];
  mentionUsers?: string[]; // User emails to @mention
}

export interface TeamsCard {
  type: 'AdaptiveCard';
  version: '1.4';
  body: any[];
  actions?: any[];
}

/**
 * Send message to Microsoft Teams using Adaptive Cards
 */
export async function sendTeamsMessage(
  webhookUrl: string,
  card: TeamsCard,
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: card,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        'Teams webhook failed:',
        response.status,
        response.statusText,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Teams message:', error);
    return false;
  }
}

/**
 * Create Adaptive Card for task notification
 */
function createTaskCard(
  event: 'task_created' | 'task_completed' | 'task_overdue',
  task: {
    title: string;
    status: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  },
): TeamsCard {
  const colors = {
    task_created: 'Accent',
    task_completed: 'Good',
    task_overdue: 'Attention',
  };

  const icons = {
    task_created: '📝',
    task_completed: '✅',
    task_overdue: '⚠️',
  };

  const titles = {
    task_created: 'New Task Created',
    task_completed: 'Task Completed',
    task_overdue: 'Task Overdue',
  };

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `${icons[event]} ${titles[event]}`,
        size: 'Large',
        weight: 'Bolder',
        color: colors[event],
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Task:',
            value: task.title,
          },
          {
            title: 'Status:',
            value: task.status,
          },
          ...(task.priority
            ? [
                {
                  title: 'Priority:',
                  value: task.priority.toUpperCase(),
                },
              ]
            : []),
          ...(task.assignedTo
            ? [
                {
                  title: 'Assigned To:',
                  value: task.assignedTo,
                },
              ]
            : []),
          ...(task.dueDate
            ? [
                {
                  title: 'Due Date:',
                  value: new Date(task.dueDate).toLocaleDateString(),
                },
              ]
            : []),
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View Task',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/tasks`,
      },
    ],
  };
}

/**
 * Create Adaptive Card for certificate notification
 */
function createCertificateCard(
  event: 'certificate_expiring' | 'certificate_expired' | 'certificate_renewed',
  certificate: {
    name: string;
    expiryDate: string;
    daysRemaining?: number;
  },
): TeamsCard {
  const colors = {
    certificate_expiring: 'Warning',
    certificate_expired: 'Attention',
    certificate_renewed: 'Good',
  };

  const icons = {
    certificate_expiring: '⏰',
    certificate_expired: '❌',
    certificate_renewed: '✅',
  };

  const titles = {
    certificate_expiring: 'Certificate Expiring Soon',
    certificate_expired: 'Certificate Expired',
    certificate_renewed: 'Certificate Renewed',
  };

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `${icons[event]} ${titles[event]}`,
        size: 'Large',
        weight: 'Bolder',
        color: colors[event],
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Certificate:',
            value: certificate.name,
          },
          {
            title:
              event === 'certificate_renewed'
                ? 'New Expiry Date:'
                : 'Expiry Date:',
            value: new Date(certificate.expiryDate).toLocaleDateString(),
          },
          ...(certificate.daysRemaining !== undefined
            ? [
                {
                  title: 'Days Remaining:',
                  value: certificate.daysRemaining.toString(),
                },
              ]
            : []),
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View Certificates',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates`,
      },
    ],
  };
}

/**
 * Create Adaptive Card for compliance alert
 */
function createComplianceAlertCard(
  severity: 'low' | 'medium' | 'high' | 'critical',
  alert: {
    title: string;
    description: string;
    category?: string;
  },
): TeamsCard {
  const colors = {
    low: 'Default',
    medium: 'Warning',
    high: 'Attention',
    critical: 'Attention',
  };

  const icons = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '❗',
    critical: '🚨',
  };

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `${icons[severity]} Compliance Alert - ${severity.toUpperCase()}`,
        size: 'Large',
        weight: 'Bolder',
        color: colors[severity],
      },
      {
        type: 'TextBlock',
        text: alert.title,
        size: 'Medium',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: alert.description,
        wrap: true,
      },
      ...(alert.category
        ? [
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Category:',
                  value: alert.category,
                },
              ],
            },
          ]
        : []),
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View Details',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    ],
  };
}

/**
 * Create Adaptive Card for risk analysis
 */
function createRiskAnalysisCard(analysis: {
  overallRiskScore: number;
  riskLevel: string;
  totalRisks: number;
  topRisks: Array<{ title: string; severity: string }>;
}): TeamsCard {
  const colors = {
    low: 'Good',
    medium: 'Warning',
    high: 'Attention',
    critical: 'Attention',
  };

  const icons = {
    low: '✅',
    medium: '⚠️',
    high: '❗',
    critical: '🚨',
  };

  const color = colors[analysis.riskLevel as keyof typeof colors];
  const icon = icons[analysis.riskLevel as keyof typeof icons];

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `${icon} Risk Analysis Complete`,
        size: 'Large',
        weight: 'Bolder',
        color,
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Risk Level:',
            value: analysis.riskLevel.toUpperCase(),
          },
          {
            title: 'Risk Score:',
            value: `${analysis.overallRiskScore}/100`,
          },
          {
            title: 'Total Risks:',
            value: analysis.totalRisks.toString(),
          },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Top Risks:',
        weight: 'Bolder',
        spacing: 'Medium',
      },
      {
        type: 'Container',
        items: analysis.topRisks.slice(0, 3).map((risk) => ({
          type: 'TextBlock',
          text: `• ${risk.title} (${risk.severity})`,
          wrap: true,
        })),
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View Full Analysis',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/risk-analysis`,
      },
    ],
  };
}

/**
 * Send task notification to Teams
 */
export async function sendTeamsTaskNotification(
  organizationId: string,
  task: {
    id: string;
    title: string;
    status: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  },
  event: 'task_created' | 'task_completed' | 'task_overdue',
): Promise<void> {
  const config = await getTeamsConfig(organizationId);
  if (!config || !config.enabledEvents.includes(event)) {
    return;
  }

  const card = createTaskCard(event, task);
  const success = await sendTeamsMessage(config.webhookUrl, card);

  await logTeamsEvent(organizationId, event, success);
}

/**
 * Send certificate notification to Teams
 */
export async function sendTeamsCertificateNotification(
  organizationId: string,
  certificate: {
    id: string;
    name: string;
    expiryDate: string;
    daysRemaining?: number;
  },
  event: 'certificate_expiring' | 'certificate_expired' | 'certificate_renewed',
): Promise<void> {
  const config = await getTeamsConfig(organizationId);
  if (!config || !config.enabledEvents.includes(event)) {
    return;
  }

  const card = createCertificateCard(event, certificate);
  const success = await sendTeamsMessage(config.webhookUrl, card);

  await logTeamsEvent(organizationId, event, success);
}

/**
 * Send compliance alert to Teams
 */
export async function sendTeamsComplianceAlert(
  organizationId: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  alert: {
    title: string;
    description: string;
    category?: string;
  },
): Promise<void> {
  const config = await getTeamsConfig(organizationId);
  if (!config || !config.enabledEvents.includes('compliance_alert')) {
    return;
  }

  const card = createComplianceAlertCard(severity, alert);
  const success = await sendTeamsMessage(config.webhookUrl, card);

  await logTeamsEvent(organizationId, 'compliance_alert', success);
}

/**
 * Send risk analysis notification to Teams
 */
export async function sendTeamsRiskAnalysis(
  organizationId: string,
  analysis: {
    overallRiskScore: number;
    riskLevel: string;
    totalRisks: number;
    topRisks: Array<{ title: string; severity: string }>;
  },
): Promise<void> {
  const config = await getTeamsConfig(organizationId);
  if (!config || !config.enabledEvents.includes('risk_analysis_complete')) {
    return;
  }

  const card = createRiskAnalysisCard(analysis);
  const success = await sendTeamsMessage(config.webhookUrl, card);

  await logTeamsEvent(organizationId, 'risk_analysis_complete', success);
}

/**
 * Get Teams configuration
 */
export async function getTeamsConfig(
  organizationId: string,
): Promise<TeamsConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('integration_type', 'teams')
    .eq('enabled', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    webhookUrl: data.webhook_url,
    channelName: data.channel,
    enabledEvents: data.events as TeamsEventType[],
    mentionUsers: data.mention_users || [],
  };
}

/**
 * Save Teams configuration
 */
export async function saveTeamsConfig(
  organizationId: string,
  config: TeamsConfig,
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('integration_configs')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('integration_type', 'teams')
    .single();

  if (existing) {
    await supabase
      .from('integration_configs')
      .update({
        webhook_url: config.webhookUrl,
        channel: config.channelName,
        events: config.enabledEvents,
        mention_users: config.mentionUsers || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('integration_configs').insert({
      organization_id: organizationId,
      integration_type: 'teams',
      name: 'Microsoft Teams',
      webhook_url: config.webhookUrl,
      channel: config.channelName,
      enabled: true,
      events: config.enabledEvents,
      mention_users: config.mentionUsers || [],
    });
  }

  await logActivity({
    organization_id: organizationId,
    user_id: '',
    action: 'configure',
    entity_type: 'integration',
    entity_id: organizationId,
    entity_name: 'Microsoft Teams',
    metadata: { events: config.enabledEvents },
  });
}

/**
 * Test Teams integration
 */
export async function testTeamsIntegration(organizationId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const config = await getTeamsConfig(organizationId);
  if (!config) {
    return {
      success: false,
      message: 'Teams integration not configured',
    };
  }

  const testCard: TeamsCard = {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: '✅ Test Message from FormaOS',
        size: 'Large',
        weight: 'Bolder',
        color: 'Good',
      },
      {
        type: 'TextBlock',
        text: 'Your Microsoft Teams integration is working correctly!',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          {
            title: 'Channel:',
            value: config.channelName,
          },
          {
            title: 'Timestamp:',
            value: new Date().toLocaleString(),
          },
        ],
      },
    ],
  };

  const success = await sendTeamsMessage(config.webhookUrl, testCard);

  return {
    success,
    message: success
      ? 'Test message sent successfully to Microsoft Teams'
      : 'Failed to send test message. Check webhook URL and permissions.',
  };
}

/**
 * Disable Teams integration
 */
export async function disableTeamsIntegration(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('integration_configs')
    .update({ enabled: false })
    .eq('organization_id', organizationId)
    .eq('integration_type', 'teams');
}

/**
 * Log Teams event
 */
async function logTeamsEvent(
  organizationId: string,
  eventType: TeamsEventType,
  success: boolean,
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('integration_events').insert({
    organization_id: organizationId,
    integration_type: 'teams',
    event_type: eventType,
    status: success ? 'sent' : 'failed',
    payload: {},
    created_at: new Date().toISOString(),
  });
}

/**
 * Get Teams statistics
 */
export async function getTeamsStats(organizationId: string): Promise<{
  totalSent: number;
  successRate: number;
  eventCounts: Record<TeamsEventType, number>;
}> {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('integration_events')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('integration_type', 'teams')
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!events) {
    return {
      totalSent: 0,
      successRate: 0,
      eventCounts: {} as Record<TeamsEventType, number>,
    };
  }

  const totalSent = events.length;
  const successCount = events.filter((e: any) => e.status === 'sent').length;
  const successRate =
    totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

  const eventCounts: Record<string, number> = {};
  events.forEach((event) => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
  });

  return {
    totalSent,
    successRate,
    eventCounts: eventCounts as Record<TeamsEventType, number>,
  };
}
