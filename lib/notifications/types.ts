export type NotificationEventType =
  | 'task.assigned'
  | 'task.due_soon'
  | 'task.overdue'
  | 'task.completed'
  | 'evidence.review_requested'
  | 'evidence.approved'
  | 'evidence.rejected'
  | 'certificate.expiring_30d'
  | 'certificate.expiring_7d'
  | 'certificate.expired'
  | 'compliance.score_dropped'
  | 'compliance.score_improved'
  | 'compliance.gap_detected'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  | 'workflow.approval_requested'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'incident.created'
  | 'incident.escalated'
  | 'incident.resolved'
  | 'system.maintenance'
  | 'system.release'
  | 'system.security_alert'
  | 'report.ready'
  | 'export.completed'
  | 'export.failed';

export type NotificationChannelType = 'in_app' | 'email' | 'slack' | 'teams';
export type NotificationDigestFrequency =
  | 'instant'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory =
  | 'tasks'
  | 'compliance'
  | 'team'
  | 'system'
  | 'workflow'
  | 'incident'
  | 'reports';

export type ActivityActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'assigned'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'uploaded'
  | 'downloaded'
  | 'commented'
  | 'shared'
  | 'archived'
  | 'restored';

export type NotificationData = Record<string, unknown> & {
  href?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  dedupeKey?: string;
};

export interface NotificationEvent<TData extends NotificationData = NotificationData> {
  type: NotificationEventType;
  title: string;
  body: string;
  data?: TData;
  priority?: NotificationPriority;
  dedupeKey?: string;
  dedupeWindowMinutes?: number;
}

export type NotificationRecipients =
  | string[]
  | {
      userIds?: string[];
      roles?: Array<'owner' | 'admin' | 'member' | 'viewer'>;
      includeAllMembers?: boolean;
    };

export interface NotificationUserContext {
  userId: string;
  orgId: string;
  email: string | null;
  fullName: string | null;
  timezone: string | null;
}

export interface NotificationPreferenceRow {
  id: string;
  user_id: string;
  org_id: string;
  channel: NotificationChannelType;
  event_type: NotificationEventType;
  enabled: boolean;
  digest_frequency: NotificationDigestFrequency;
  quiet_hours?: Record<string, unknown> | null;
}

export interface NotificationChannelRow {
  id: string;
  user_id: string;
  org_id: string;
  channel_type: NotificationChannelType;
  config: Record<string, unknown>;
  verified: boolean;
}

export interface NotificationRecord {
  id: string;
  org_id: string;
  user_id: string;
  type: NotificationEventType;
  title: string;
  body: string | null;
  data: NotificationData;
  priority: NotificationPriority;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface ActivityFeedRecord {
  id: string;
  org_id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_name?: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface QuietHoursConfig {
  enabled?: boolean;
  start?: string;
  end?: string;
  timezone?: string;
}

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  'task.assigned',
  'task.due_soon',
  'task.overdue',
  'task.completed',
  'evidence.review_requested',
  'evidence.approved',
  'evidence.rejected',
  'certificate.expiring_30d',
  'certificate.expiring_7d',
  'certificate.expired',
  'compliance.score_dropped',
  'compliance.score_improved',
  'compliance.gap_detected',
  'member.joined',
  'member.removed',
  'member.role_changed',
  'workflow.approval_requested',
  'workflow.completed',
  'workflow.failed',
  'incident.created',
  'incident.escalated',
  'incident.resolved',
  'system.maintenance',
  'system.release',
  'system.security_alert',
  'report.ready',
  'export.completed',
  'export.failed',
];

export const NOTIFICATION_CHANNELS: NotificationChannelType[] = [
  'in_app',
  'email',
  'slack',
  'teams',
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  tasks: 'Tasks',
  compliance: 'Compliance',
  team: 'Team',
  system: 'System',
  workflow: 'Workflow',
  incident: 'Incidents',
  reports: 'Reports',
};

export const EVENT_CATEGORY_MAP: Record<NotificationEventType, NotificationCategory> = {
  'task.assigned': 'tasks',
  'task.due_soon': 'tasks',
  'task.overdue': 'tasks',
  'task.completed': 'tasks',
  'evidence.review_requested': 'compliance',
  'evidence.approved': 'compliance',
  'evidence.rejected': 'compliance',
  'certificate.expiring_30d': 'compliance',
  'certificate.expiring_7d': 'compliance',
  'certificate.expired': 'compliance',
  'compliance.score_dropped': 'compliance',
  'compliance.score_improved': 'compliance',
  'compliance.gap_detected': 'compliance',
  'member.joined': 'team',
  'member.removed': 'team',
  'member.role_changed': 'team',
  'workflow.approval_requested': 'workflow',
  'workflow.completed': 'workflow',
  'workflow.failed': 'workflow',
  'incident.created': 'incident',
  'incident.escalated': 'incident',
  'incident.resolved': 'incident',
  'system.maintenance': 'system',
  'system.release': 'system',
  'system.security_alert': 'system',
  'report.ready': 'reports',
  'export.completed': 'reports',
  'export.failed': 'reports',
};

export const EVENT_LABELS: Record<NotificationEventType, string> = {
  'task.assigned': 'Task assigned',
  'task.due_soon': 'Task due soon',
  'task.overdue': 'Task overdue',
  'task.completed': 'Task completed',
  'evidence.review_requested': 'Evidence review requested',
  'evidence.approved': 'Evidence approved',
  'evidence.rejected': 'Evidence rejected',
  'certificate.expiring_30d': 'Certificate expiring in 30 days',
  'certificate.expiring_7d': 'Certificate expiring in 7 days',
  'certificate.expired': 'Certificate expired',
  'compliance.score_dropped': 'Compliance score dropped',
  'compliance.score_improved': 'Compliance score improved',
  'compliance.gap_detected': 'Compliance gap detected',
  'member.joined': 'Member joined',
  'member.removed': 'Member removed',
  'member.role_changed': 'Member role changed',
  'workflow.approval_requested': 'Workflow approval requested',
  'workflow.completed': 'Workflow completed',
  'workflow.failed': 'Workflow failed',
  'incident.created': 'Incident created',
  'incident.escalated': 'Incident escalated',
  'incident.resolved': 'Incident resolved',
  'system.maintenance': 'System maintenance',
  'system.release': 'System release',
  'system.security_alert': 'Security alert',
  'report.ready': 'Report ready',
  'export.completed': 'Export completed',
  'export.failed': 'Export failed',
};

export function getNotificationCategory(
  eventType: NotificationEventType,
): NotificationCategory {
  return EVENT_CATEGORY_MAP[eventType];
}

export function getDefaultDigestFrequency(
  channel: NotificationChannelType,
  priority: NotificationPriority,
): NotificationDigestFrequency {
  if (channel !== 'email') {
    return 'instant';
  }

  if (priority === 'critical') {
    return 'instant';
  }

  if (priority === 'high') {
    return 'hourly';
  }

  return 'daily';
}
