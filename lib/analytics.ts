/**
 * =========================================================
 * Advanced Analytics Engine
 * =========================================================
 * Data aggregation and analytics for compliance metrics
 */

import { createClient } from '@/lib/supabase/server';

export interface ComplianceMetrics {
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringSoon: number;
  completionRate: number;
  averageCompletionTime: number;
}

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  membersByRole: Record<string, number>;
  averageTasksPerMember: number;
  topPerformers: Array<{
    email: string;
    completedTasks: number;
    complianceRate: number;
  }>;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface RiskScore {
  overall: number;
  factors: Array<{
    name: string;
    score: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

/**
 * Get comprehensive compliance metrics
 */
export async function getComplianceMetrics(
  orgId: string,
): Promise<ComplianceMetrics> {
  const supabase = await createClient();

  // Get certificate counts
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, expiry_date, status')
    .eq('org_id', orgId);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalCertificates = certificates?.length || 0;
  const activeCertificates =
    certificates?.filter((c) => c.status === 'active').length || 0;
  const expiredCertificates =
    certificates?.filter((c) => c.expiry_date && new Date(c.expiry_date) < now)
      .length || 0;
  const expiringSoon =
    certificates?.filter(
      (c) =>
        c.expiry_date &&
        new Date(c.expiry_date) > now &&
        new Date(c.expiry_date) < thirtyDaysFromNow,
    ).length || 0;

  const completionRate =
    totalCertificates > 0 ? (activeCertificates / totalCertificates) * 100 : 0;

  // Get average completion time
  const { data: tasks } = await supabase
    .from('tasks')
    .select('created_at, completed_at')
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null);

  const completionTimes =
    tasks?.map((t) => {
      const created = new Date(t.created_at).getTime();
      const completed = new Date(t.completed_at).getTime();
      return (completed - created) / (1000 * 60 * 60 * 24); // days
    }) || [];

  const averageCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

  return {
    totalCertificates,
    activeCertificates,
    expiredCertificates,
    expiringSoon,
    completionRate: Math.round(completionRate),
    averageCompletionTime: Math.round(averageCompletionTime),
  };
}

/**
 * Get team performance metrics
 */
export async function getTeamMetrics(orgId: string): Promise<TeamMetrics> {
  const supabase = await createClient();

  // Get all members
  const { data: members } = await supabase
    .from('org_members')
    .select('id, email, role, last_active')
    .eq('org_id', orgId);

  const totalMembers = members?.length || 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeMembers =
    members?.filter(
      (m) => m.last_active && new Date(m.last_active) > thirtyDaysAgo,
    ).length || 0;

  // Group by role
  const membersByRole =
    members?.reduce(
      (acc, m) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  // Get tasks per member
  const { data: tasks } = await supabase
    .from('tasks')
    .select('assigned_to, status')
    .eq('org_id', orgId);

  const averageTasksPerMember =
    totalMembers > 0 ? (tasks?.length || 0) / totalMembers : 0;

  // Get top performers
  const tasksByMember =
    tasks?.reduce(
      (acc, t) => {
        if (!t.assigned_to) return acc;
        if (!acc[t.assigned_to]) {
          acc[t.assigned_to] = { total: 0, completed: 0 };
        }
        acc[t.assigned_to].total++;
        if (t.status === 'completed') {
          acc[t.assigned_to].completed++;
        }
        return acc;
      },
      {} as Record<string, { total: number; completed: number }>,
    ) || {};

  const topPerformers = Object.entries(tasksByMember)
    .map(([email, stats]) => ({
      email,
      completedTasks: stats.completed,
      complianceRate:
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 5);

  return {
    totalMembers,
    activeMembers,
    membersByRole,
    averageTasksPerMember: Math.round(averageTasksPerMember),
    topPerformers,
  };
}

/**
 * Get compliance trend data (last 30 days)
 */
export async function getComplianceTrend(orgId: string): Promise<TrendData[]> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .gte('completed_at', thirtyDaysAgo.toISOString());

  // Group by date
  const trendMap: Record<string, number> = {};
  completedTasks?.forEach((task) => {
    const date = new Date(task.completed_at).toISOString().split('T')[0];
    trendMap[date] = (trendMap[date] || 0) + 1;
  });

  // Fill in missing dates
  const trend: TrendData[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    trend.push({
      date,
      value: trendMap[date] || 0,
    });
  }

  return trend;
}

/**
 * Calculate risk score based on various factors
 */
export async function calculateRiskScore(orgId: string): Promise<RiskScore> {
  const supabase = await createClient();

  const factors: RiskScore['factors'] = [];
  let totalScore = 0;

  // Factor 1: Expired certificates
  const { data: expiredCerts } = await supabase
    .from('certificates')
    .select('id')
    .eq('org_id', orgId)
    .lt('expiry_date', new Date().toISOString());

  const expiredCount = expiredCerts?.length || 0;
  const expiredScore = Math.min(expiredCount * 10, 100);
  totalScore += expiredScore;
  factors.push({
    name: 'Expired Certificates',
    score: expiredScore,
    impact: expiredScore > 50 ? 'high' : expiredScore > 20 ? 'medium' : 'low',
    description: `${expiredCount} certificates have expired`,
  });

  // Factor 2: Overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString());

  const overdueCount = overdueTasks?.length || 0;
  const overdueScore = Math.min(overdueCount * 5, 100);
  totalScore += overdueScore;
  factors.push({
    name: 'Overdue Tasks',
    score: overdueScore,
    impact: overdueScore > 50 ? 'high' : overdueScore > 20 ? 'medium' : 'low',
    description: `${overdueCount} tasks are overdue`,
  });

  // Factor 3: Inactive members
  const { data: members } = await supabase
    .from('org_members')
    .select('id, last_active')
    .eq('org_id', orgId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveCount =
    members?.filter(
      (m) => !m.last_active || new Date(m.last_active) < thirtyDaysAgo,
    ).length || 0;
  const inactiveScore = members?.length
    ? (inactiveCount / members.length) * 100
    : 0;
  totalScore += inactiveScore;
  factors.push({
    name: 'Inactive Members',
    score: Math.round(inactiveScore),
    impact: inactiveScore > 50 ? 'high' : inactiveScore > 20 ? 'medium' : 'low',
    description: `${inactiveCount} members inactive in last 30 days`,
  });

  const overall = Math.min(Math.round(totalScore / factors.length), 100);

  return {
    overall,
    factors,
  };
}

/**
 * Export analytics data to CSV
 */
export async function exportAnalytics(orgId: string): Promise<string> {
  const [compliance, team, trend, risk] = await Promise.all([
    getComplianceMetrics(orgId),
    getTeamMetrics(orgId),
    getComplianceTrend(orgId),
    calculateRiskScore(orgId),
  ]);

  const csv = [
    'Metric,Value',
    `Total Certificates,${compliance.totalCertificates}`,
    `Active Certificates,${compliance.activeCertificates}`,
    `Expired Certificates,${compliance.expiredCertificates}`,
    `Completion Rate,${compliance.completionRate}%`,
    `Average Completion Time,${compliance.averageCompletionTime} days`,
    `Total Members,${team.totalMembers}`,
    `Active Members,${team.activeMembers}`,
    `Risk Score,${risk.overall}/100`,
    '',
    'Date,Completed Tasks',
    ...trend.map((t) => `${t.date},${t.value}`),
  ].join('\n');

  return csv;
}
