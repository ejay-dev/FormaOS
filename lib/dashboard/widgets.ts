/**
 * =========================================================
 * Dashboard Widget Library
 * =========================================================
 * Customizable widgets for compliance dashboards
 */

import { createClient } from '@/lib/supabase/server';

export type WidgetType =
  | 'risk_score'
  | 'certificate_status'
  | 'task_progress'
  | 'compliance_score'
  | 'team_activity'
  | 'trend_chart'
  | 'recent_alerts'
  | 'quick_stats';

export interface WidgetConfig {
  id: string;
  organizationId: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  refreshInterval: number; // seconds
  settings: Record<string, any>;
  enabled: boolean;
}

export interface WidgetData {
  widgetId: string;
  type: WidgetType;
  data: any;
  lastUpdated: string;
}

/**
 * Risk Score Widget Data
 */
export async function getRiskScoreWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const { data: latestAnalysis } = await supabase
    .from('risk_analyses')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!latestAnalysis) {
    return {
      score: 0,
      level: 'low',
      trend: 'stable',
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
  }

  return {
    score: latestAnalysis.overall_risk_score,
    level: latestAnalysis.risk_level,
    trend: latestAnalysis.trends?.direction || 'stable',
    critical: latestAnalysis.risks_by_severity?.critical || 0,
    high: latestAnalysis.risks_by_severity?.high || 0,
    medium: latestAnalysis.risks_by_severity?.medium || 0,
    low: latestAnalysis.risks_by_severity?.low || 0,
    changePercent: latestAnalysis.trends?.changePercent || 0,
  };
}

/**
 * Certificate Status Widget Data
 */
export async function getCertificateStatusWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: allCerts } = await supabase
    .from('certificates')
    .select('*')
    .eq('organization_id', organizationId);

  if (!allCerts) {
    return {
      total: 0,
      active: 0,
      expiringSoon: 0,
      expired: 0,
      certificates: [],
    };
  }

  const active = allCerts.filter((cert) => new Date(cert.expiry_date) > now);
  const expiringSoon = allCerts.filter((cert) => {
    const expiry = new Date(cert.expiry_date);
    return expiry > now && expiry <= thirtyDaysOut;
  });
  const expired = allCerts.filter((cert) => new Date(cert.expiry_date) <= now);

  const upcomingExpiry = [...expiringSoon, ...expired]
    .sort(
      (a, b) =>
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime(),
    )
    .slice(0, 5)
    .map((cert) => ({
      id: cert.id,
      name: cert.name,
      expiryDate: cert.expiry_date,
      daysRemaining: Math.ceil(
        (new Date(cert.expiry_date).getTime() - now.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
      status: new Date(cert.expiry_date) <= now ? 'expired' : 'expiring',
    }));

  return {
    total: allCerts.length,
    active: active.length,
    expiringSoon: expiringSoon.length,
    expired: expired.length,
    certificates: upcomingExpiry,
  };
}

/**
 * Task Progress Widget Data
 */
export async function getTaskProgressWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId);

  if (!allTasks) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      completionRate: 0,
      recentTasks: [],
    };
  }

  const now = new Date();
  const completed = allTasks.filter((t) => t.status === 'completed');
  const inProgress = allTasks.filter((t) => t.status === 'in_progress');
  const notStarted = allTasks.filter((t) => t.status === 'not_started');
  const overdue = allTasks.filter(
    (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now,
  );

  const completionRate =
    allTasks.length > 0
      ? Math.round((completed.length / allTasks.length) * 100)
      : 0;

  // Get recent completed tasks
  const recentTasks = completed
    .sort(
      (a, b) =>
        new Date(b.completed_at || 0).getTime() -
        new Date(a.completed_at || 0).getTime(),
    )
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      completedAt: task.completed_at,
      priority: task.priority,
    }));

  return {
    total: allTasks.length,
    completed: completed.length,
    inProgress: inProgress.length,
    notStarted: notStarted.length,
    overdue: overdue.length,
    completionRate,
    recentTasks,
  };
}

/**
 * Compliance Score Widget Data
 */
export async function getComplianceScoreWidgetData(
  organizationId: string,
  framework?: string,
): Promise<any> {
  const supabase = await createClient();

  let query = supabase
    .from('compliance_scans')
    .select('*')
    .eq('organization_id', organizationId)
    .order('completed_at', { ascending: false });

  if (framework) {
    query = query.eq('framework', framework);
  }

  const { data: scans } = await query.limit(1);

  if (!scans || scans.length === 0) {
    return {
      score: 0,
      framework: framework || 'none',
      compliant: 0,
      nonCompliant: 0,
      partial: 0,
      lastScan: null,
      trend: 'stable',
    };
  }

  const latestScan = scans[0];

  // Get previous scan for trend
  const { data: previousScans } = await supabase
    .from('compliance_scans')
    .select('compliance_score')
    .eq('organization_id', organizationId)
    .order('completed_at', { ascending: false })
    .limit(2);

  let trend = 'stable';
  if (previousScans && previousScans.length === 2) {
    const diff =
      previousScans[0].compliance_score - previousScans[1].compliance_score;
    if (diff > 5) trend = 'improving';
    else if (diff < -5) trend = 'declining';
  }

  return {
    score: latestScan.compliance_score,
    framework: latestScan.framework,
    compliant: latestScan.compliant,
    nonCompliant: latestScan.non_compliant,
    partial: latestScan.partial,
    lastScan: latestScan.completed_at,
    trend,
  };
}

/**
 * Team Activity Widget Data
 */
export async function getTeamActivityWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: activities } = await supabase
    .from('activity_logs')
    .select('user_id, action, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (!activities) {
    return {
      totalActivities: 0,
      activeUsers: 0,
      topContributors: [],
      activityByDay: [],
    };
  }

  // Count activities by user
  const userActivityMap = new Map<string, number>();
  activities.forEach((activity) => {
    const count = userActivityMap.get(activity.user_id) || 0;
    userActivityMap.set(activity.user_id, count + 1);
  });

  // Get top contributors with user details
  const topUserIds = Array.from(userActivityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId]) => userId);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', topUserIds);

  const topContributors = topUserIds.map((userId) => {
    const user = users?.find((u) => u.id === userId);
    return {
      userId,
      name: user?.full_name || 'Unknown User',
      avatar: user?.avatar_url,
      activityCount: userActivityMap.get(userId) || 0,
    };
  });

  // Activity by day (last 30 days)
  const activityByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayActivities = activities.filter((a) =>
      a.created_at.startsWith(dateStr),
    );
    activityByDay.push({
      date: dateStr,
      count: dayActivities.length,
    });
  }

  return {
    totalActivities: activities.length,
    activeUsers: userActivityMap.size,
    topContributors,
    activityByDay,
  };
}

/**
 * Trend Chart Widget Data
 */
export async function getTrendChartWidgetData(
  organizationId: string,
  metric: 'risk' | 'compliance' | 'tasks',
  days = 30,
): Promise<any> {
  const supabase = await createClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  if (metric === 'risk') {
    const { data } = await supabase
      .from('risk_analyses')
      .select('overall_risk_score, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    return {
      metric: 'risk',
      dataPoints:
        data?.map((d) => ({
          date: d.created_at.split('T')[0],
          value: d.overall_risk_score,
        })) || [],
    };
  }

  if (metric === 'compliance') {
    const { data } = await supabase
      .from('compliance_scans')
      .select('compliance_score, completed_at')
      .eq('organization_id', organizationId)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: true });

    return {
      metric: 'compliance',
      dataPoints:
        data?.map((d) => ({
          date: d.completed_at.split('T')[0],
          value: d.compliance_score,
        })) || [],
    };
  }

  // Tasks metric - calculate daily completion rate
  const { data: tasks } = await supabase
    .from('tasks')
    .select('completed_at, status')
    .eq('organization_id', organizationId);

  const dataPoints = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const completedByDate =
      tasks?.filter(
        (t) => t.completed_at && t.completed_at <= dateStr + 'T23:59:59',
      ).length || 0;

    const totalByDate = tasks?.length || 0;
    const completionRate =
      totalByDate > 0 ? Math.round((completedByDate / totalByDate) * 100) : 0;

    dataPoints.push({
      date: dateStr,
      value: completionRate,
    });
  }

  return {
    metric: 'tasks',
    dataPoints,
  };
}

/**
 * Recent Alerts Widget Data
 */
export async function getRecentAlertsWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .in('type', ['risk_alert', 'compliance_alert', 'certificate_expiring'])
    .order('created_at', { ascending: false })
    .limit(10);

  const alerts =
    notifications?.map((notif) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      severity: notif.metadata?.severity || 'medium',
      createdAt: notif.created_at,
      read: notif.read,
    })) || [];

  const unreadCount = alerts.filter((a) => !a.read).length;

  return {
    alerts,
    unreadCount,
    totalCount: alerts.length,
  };
}

/**
 * Quick Stats Widget Data
 */
export async function getQuickStatsWidgetData(
  organizationId: string,
): Promise<any> {
  const supabase = await createClient();

  const [riskData, certData, taskData, complianceData] = await Promise.all([
    getRiskScoreWidgetData(organizationId),
    getCertificateStatusWidgetData(organizationId),
    getTaskProgressWidgetData(organizationId),
    getComplianceScoreWidgetData(organizationId),
  ]);

  return {
    riskScore: riskData.score,
    riskLevel: riskData.level,
    certificatesExpiring: certData.expiringSoon,
    certificatesExpired: certData.expired,
    tasksOverdue: taskData.overdue,
    taskCompletionRate: taskData.completionRate,
    complianceScore: complianceData.score,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get widget data based on type
 */
export async function getWidgetData(
  widgetId: string,
  type: WidgetType,
  organizationId: string,
  settings?: Record<string, any>,
): Promise<WidgetData> {
  let data: any;

  switch (type) {
    case 'risk_score':
      data = await getRiskScoreWidgetData(organizationId);
      break;
    case 'certificate_status':
      data = await getCertificateStatusWidgetData(organizationId);
      break;
    case 'task_progress':
      data = await getTaskProgressWidgetData(organizationId);
      break;
    case 'compliance_score':
      data = await getComplianceScoreWidgetData(
        organizationId,
        settings?.framework,
      );
      break;
    case 'team_activity':
      data = await getTeamActivityWidgetData(organizationId);
      break;
    case 'trend_chart':
      data = await getTrendChartWidgetData(
        organizationId,
        settings?.metric || 'risk',
        settings?.days || 30,
      );
      break;
    case 'recent_alerts':
      data = await getRecentAlertsWidgetData(organizationId);
      break;
    case 'quick_stats':
      data = await getQuickStatsWidgetData(organizationId);
      break;
    default:
      data = {};
  }

  return {
    widgetId,
    type,
    data,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save widget configuration
 */
export async function saveWidgetConfig(config: WidgetConfig): Promise<void> {
  const supabase = await createClient();

  await supabase.from('dashboard_layouts').upsert({
    widget_id: config.id,
    organization_id: config.organizationId,
    widget_type: config.type,
    title: config.title,
    size: config.size,
    position: config.position,
    refresh_interval: config.refreshInterval,
    settings: config.settings,
    enabled: config.enabled,
  });
}

/**
 * Get dashboard layout
 */
export async function getDashboardLayout(
  organizationId: string,
): Promise<WidgetConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dashboard_layouts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('enabled', true);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.widget_id,
    organizationId: row.organization_id,
    type: row.widget_type,
    title: row.title,
    size: row.size,
    position: row.position,
    refreshInterval: row.refresh_interval,
    settings: row.settings,
    enabled: row.enabled,
  }));
}

/**
 * Delete widget
 */
export async function deleteWidget(widgetId: string): Promise<void> {
  const supabase = await createClient();

  await supabase.from('dashboard_layouts').delete().eq('widget_id', widgetId);
}
