/**
 * =========================================================
 * Audit Trail & Activity Logging System
 * =========================================================
 * Comprehensive activity tracking with searchable history
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { getCached, CacheKeys } from './cache';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'invite'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'complete';

export type ActivityEntity =
  | 'task'
  | 'certificate'
  | 'evidence'
  | 'member'
  | 'organization'
  | 'role'
  | 'permission'
  | 'report'
  | 'workflow'
  | 'auth';

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: ActivityEntity;
  entity_id?: string;
  entity_name?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface AuditFilters {
  userId?: string;
  actions?: ActivityAction[];
  entityTypes?: ActivityEntity[];
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditOptions {
  limit?: number;
  offset?: number;
  filters?: AuditFilters;
}

/**
 * Log an activity
 */
export async function logActivity(
  orgId: string,
  userId: string,
  action: ActivityAction,
  entityType: ActivityEntity,
  options: {
    entityId?: string;
    entityName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  } = {},
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('activity_logs').insert({
    organization_id: orgId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: options.entityId,
    entity_name: options.entityName,
    details: options.details,
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
  });
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(
  orgId: string,
  options: AuditOptions = {},
): Promise<{ logs: ActivityLog[]; total: number }> {
  const supabase = await createClient();
  const { limit = 50, offset = 0, filters = {} } = options;

  let query = supabase
    .from('activity_logs')
    .select('*, profiles!user_id(full_name, email, avatar_url)', {
      count: 'exact',
    })
    .eq('organization_id', orgId);

  // Apply filters
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.actions && filters.actions.length > 0) {
    query = query.in('action', filters.actions);
  }

  if (filters.entityTypes && filters.entityTypes.length > 0) {
    query = query.in('entity_type', filters.entityTypes);
  }

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.search) {
    query = query.or(
      `entity_name.ilike.%${filters.search}%,details->>'description'.ilike.%${filters.search}%`,
    );
  }

  // Execute query
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching activity logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data || []).map((log: any) => ({
      ...log,
      user: log.profiles,
    })),
    total: count || 0,
  };
}

/**
 * Get activity summary for a specific entity
 */
export async function getEntityActivity(
  orgId: string,
  entityType: ActivityEntity,
  entityId: string,
  limit = 20,
): Promise<ActivityLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, profiles!user_id(full_name, email, avatar_url)')
    .eq('organization_id', orgId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((log: any) => ({
    ...log,
    user: log.profiles,
  }));
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  orgId: string,
  userId: string,
  days = 30,
): Promise<{
  totalActions: number;
  actionBreakdown: Record<ActivityAction, number>;
  entityBreakdown: Record<ActivityEntity, number>;
  recentActivity: ActivityLog[];
}> {
  const supabase = await createClient();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: false });

  if (error || !data) {
    return {
      totalActions: 0,
      actionBreakdown: {} as Record<ActivityAction, number>,
      entityBreakdown: {} as Record<ActivityEntity, number>,
      recentActivity: [],
    };
  }

  // Calculate breakdowns
  const actionBreakdown: Record<string, number> = {};
  const entityBreakdown: Record<string, number> = {};

  data.forEach((log: { action: string; entity_type: string }) => {
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    entityBreakdown[log.entity_type] =
      (entityBreakdown[log.entity_type] || 0) + 1;
  });

  return {
    totalActions: data.length,
    actionBreakdown: actionBreakdown as Record<ActivityAction, number>,
    entityBreakdown: entityBreakdown as Record<ActivityEntity, number>,
    recentActivity: data.slice(0, 10),
  };
}

/**
 * Get organization activity trends
 */
export async function getActivityTrends(
  orgId: string,
  days = 30,
): Promise<
  {
    date: string;
    count: number;
    actions: Record<ActivityAction, number>;
  }[]
> {
  const supabase = await createClient();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('created_at, action')
    .eq('organization_id', orgId)
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Group by date
  const trends: Record<
    string,
    { count: number; actions: Record<string, number> }
  > = {};

  data.forEach((log: { created_at: string; action: string }) => {
    const date = new Date(log.created_at).toISOString().split('T')[0];

    if (!trends[date]) {
      trends[date] = {
        count: 0,
        actions: {},
      };
    }

    trends[date].count++;
    trends[date].actions[log.action] =
      (trends[date].actions[log.action] || 0) + 1;
  });

  return Object.entries(trends).map(([date, data]) => ({
    date,
    count: data.count,
    actions: data.actions as Record<ActivityAction, number>,
  }));
}

/**
 * Export activity logs to CSV
 */
export async function exportActivityLogs(
  orgId: string,
  filters: AuditFilters = {},
): Promise<string> {
  const { logs } = await getActivityLogs(orgId, { filters, limit: 10000 });

  // CSV header
  let csv = 'Date,User,Action,Entity Type,Entity Name,Details,IP Address\n';

  // CSV rows
  logs.forEach((log) => {
    const row = [
      log.created_at,
      log.user?.full_name || log.user?.email || 'Unknown',
      log.action,
      log.entity_type,
      log.entity_name || '',
      JSON.stringify(log.details || {}),
      log.ip_address || '',
    ];

    csv +=
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',') +
      '\n';
  });

  return csv;
}

/**
 * Get most active users
 */
export async function getMostActiveUsers(
  orgId: string,
  days = 30,
  limit = 10,
): Promise<
  {
    userId: string;
    userName: string;
    actionCount: number;
  }[]
> {
  const supabase = await createClient();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('user_id, profiles!user_id(full_name, email)')
    .eq('organization_id', orgId)
    .gte('created_at', dateFrom.toISOString());

  if (error || !data) return [];

  // Count actions per user
  const userCounts: Record<string, { name: string; count: number }> = {};

  data.forEach((log: any) => {
    if (!userCounts[log.user_id]) {
      userCounts[log.user_id] = {
        name: log.profiles?.full_name || log.profiles?.email || 'Unknown',
        count: 0,
      };
    }
    userCounts[log.user_id].count++;
  });

  // Sort and return top users
  return Object.entries(userCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      actionCount: data.count,
    }));
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(
  orgId: string,
  hours = 24,
): Promise<
  {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    userId?: string;
    count: number;
  }[]
> {
  const supabase = await createClient();
  const dateFrom = new Date();
  dateFrom.setHours(dateFrom.getHours() - hours);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('organization_id', orgId)
    .gte('created_at', dateFrom.toISOString());

  if (error || !data) return [];

  const alerts: any[] = [];

  // Check for excessive failed logins
  const failedLogins = data.filter(
    (log: any) => log.action === 'login' && log.details?.status === 'failed',
  );

  const userFailedLogins: Record<string, number> = {};
  failedLogins.forEach((log: any) => {
    userFailedLogins[log.user_id] = (userFailedLogins[log.user_id] || 0) + 1;
  });

  Object.entries(userFailedLogins).forEach(([userId, count]) => {
    if (count >= 5) {
      alerts.push({
        type: 'excessive_failed_logins',
        severity: count >= 10 ? 'high' : 'medium',
        description: `${count} failed login attempts`,
        userId,
        count,
      });
    }
  });

  // Check for mass deletions
  const deletions = data.filter((log: any) => log.action === 'delete');
  const userDeletions: Record<string, number> = {};

  deletions.forEach((log: any) => {
    userDeletions[log.user_id] = (userDeletions[log.user_id] || 0) + 1;
  });

  Object.entries(userDeletions).forEach(([userId, count]) => {
    if (count >= 10) {
      alerts.push({
        type: 'mass_deletions',
        severity: count >= 20 ? 'high' : 'medium',
        description: `${count} items deleted in ${hours} hours`,
        userId,
        count,
      });
    }
  });

  // Check for unusual access times (2 AM - 5 AM)
  const unusualTimeAccess = data.filter((log: any) => {
    const hour = new Date(log.created_at).getHours();
    return hour >= 2 && hour <= 5;
  });

  if (unusualTimeAccess.length >= 5) {
    alerts.push({
      type: 'unusual_time_access',
      severity: 'low',
      description: `${unusualTimeAccess.length} activities during unusual hours (2-5 AM)`,
      count: unusualTimeAccess.length,
    });
  }

  return alerts;
}
