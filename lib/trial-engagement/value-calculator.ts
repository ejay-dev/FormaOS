/**
 * Trial Value Calculator
 * Calculates the value a user has received during their trial
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface TrialValueMetrics {
  orgId: string;
  daysActive: number;
  daysRemaining: number;
  totalLogins: number;
  tasksCompleted: number;
  evidenceUploaded: number;
  teamMembersAdded: number;
  frameworksEnabled: number;
  complianceScore: number;
  complianceImprovement: number;
  workflowsCreated: number;
  valueScore: number; // 0-100 score representing engagement
  highlights: ValueHighlight[];
  calculatedAt: string;
}

export interface ValueHighlight {
  label: string;
  value: string | number;
  icon: 'check' | 'users' | 'shield' | 'zap' | 'file' | 'trend';
  emphasis?: boolean;
}

/**
 * Calculate trial value metrics for an organization
 */
export async function calculateTrialValue(
  orgId: string,
  trialStartDate: Date,
  trialEndDate: Date
): Promise<TrialValueMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();

  // Calculate days
  const daysActive = Math.max(
    1,
    Math.ceil((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Fetch metrics in parallel
  const [
    loginResult,
    taskResult,
    evidenceResult,
    memberResult,
    frameworkResult,
    workflowResult,
    complianceResult,
  ] = await Promise.all([
    // Total logins during trial
    admin
      .from('org_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('action', 'user.login')
      .gte('created_at', trialStartDate.toISOString()),
    // Tasks completed
    admin
      .from('org_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('completed_at', trialStartDate.toISOString()),
    // Evidence uploaded
    admin
      .from('org_evidence')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', trialStartDate.toISOString()),
    // Team members added
    admin
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    // Frameworks enabled
    admin
      .from('org_frameworks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),
    // Workflows created
    admin
      .from('org_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    // Compliance snapshots for improvement
    admin
      .from('org_compliance_snapshots')
      .select('compliance_score, captured_at')
      .eq('organization_id', orgId)
      .order('captured_at', { ascending: true })
      .limit(30),
  ]);

  const totalLogins = loginResult.count || 0;
  const tasksCompleted = taskResult.count || 0;
  const evidenceUploaded = evidenceResult.count || 0;
  const teamMembersAdded = memberResult.count || 0;
  const frameworksEnabled = frameworkResult.count || 0;
  const workflowsCreated = workflowResult.count || 0;

  // Calculate compliance improvement
  let complianceScore = 0;
  let complianceImprovement = 0;
  if (complianceResult.data && complianceResult.data.length > 0) {
    const firstScore = complianceResult.data[0].compliance_score || 0;
    const lastScore =
      complianceResult.data[complianceResult.data.length - 1].compliance_score || 0;
    complianceScore = lastScore;
    complianceImprovement = lastScore - firstScore;
  }

  // Calculate engagement value score (0-100)
  let valueScore = 0;
  valueScore += Math.min(20, (totalLogins / daysActive) * 5); // Up to 20 points for daily logins
  valueScore += Math.min(20, tasksCompleted * 2); // Up to 20 points for tasks
  valueScore += Math.min(15, evidenceUploaded * 1.5); // Up to 15 points for evidence
  valueScore += Math.min(15, teamMembersAdded * 5); // Up to 15 points for team
  valueScore += Math.min(15, frameworksEnabled * 5); // Up to 15 points for frameworks
  valueScore += Math.min(15, workflowsCreated * 5); // Up to 15 points for automation
  valueScore = Math.min(100, Math.round(valueScore));

  // Generate highlights
  const highlights: ValueHighlight[] = [];

  if (tasksCompleted > 0) {
    highlights.push({
      label: 'Tasks completed',
      value: tasksCompleted,
      icon: 'check',
      emphasis: tasksCompleted >= 10,
    });
  }

  if (evidenceUploaded > 0) {
    highlights.push({
      label: 'Evidence collected',
      value: evidenceUploaded,
      icon: 'file',
      emphasis: evidenceUploaded >= 10,
    });
  }

  if (teamMembersAdded > 1) {
    highlights.push({
      label: 'Team members',
      value: teamMembersAdded,
      icon: 'users',
    });
  }

  if (complianceScore > 0) {
    highlights.push({
      label: 'Compliance score',
      value: `${complianceScore}%`,
      icon: 'shield',
      emphasis: complianceScore >= 50,
    });
  }

  if (complianceImprovement > 0) {
    highlights.push({
      label: 'Score improvement',
      value: `+${complianceImprovement}%`,
      icon: 'trend',
      emphasis: true,
    });
  }

  if (workflowsCreated > 0) {
    highlights.push({
      label: 'Workflows created',
      value: workflowsCreated,
      icon: 'zap',
    });
  }

  return {
    orgId,
    daysActive,
    daysRemaining,
    totalLogins,
    tasksCompleted,
    evidenceUploaded,
    teamMembersAdded,
    frameworksEnabled,
    complianceScore,
    complianceImprovement,
    workflowsCreated,
    valueScore,
    highlights: highlights.slice(0, 4), // Top 4 highlights
    calculatedAt: now.toISOString(),
  };
}

/**
 * Generate value recap message based on metrics
 */
export function generateValueRecapMessage(metrics: TrialValueMetrics): string {
  const parts: string[] = [];

  if (metrics.tasksCompleted > 0) {
    parts.push(`completed ${metrics.tasksCompleted} compliance tasks`);
  }

  if (metrics.evidenceUploaded > 0) {
    parts.push(`collected ${metrics.evidenceUploaded} pieces of evidence`);
  }

  if (metrics.complianceImprovement > 0) {
    parts.push(`improved your compliance score by ${metrics.complianceImprovement}%`);
  }

  if (metrics.teamMembersAdded > 1) {
    parts.push(`onboarded ${metrics.teamMembersAdded} team members`);
  }

  if (parts.length === 0) {
    return "You've started your compliance journey with FormaOS.";
  }

  if (parts.length === 1) {
    return `During your trial, you've ${parts[0]}.`;
  }

  const lastPart = parts.pop();
  return `During your trial, you've ${parts.join(', ')} and ${lastPart}.`;
}

/**
 * Get urgency-based trial message
 */
export function getTrialUrgencyMessage(
  daysRemaining: number,
  valueScore: number
): { headline: string; subline: string; urgency: 'info' | 'warning' | 'critical' } {
  if (daysRemaining <= 0) {
    return {
      headline: 'Your trial has ended',
      subline:
        valueScore > 50
          ? "Don't lose the progress you've made — upgrade to continue."
          : 'Upgrade to unlock full access to all features.',
      urgency: 'critical',
    };
  }

  if (daysRemaining === 1) {
    return {
      headline: 'Trial ends tomorrow',
      subline:
        valueScore > 50
          ? "Lock in your plan to keep your team's momentum."
          : 'Choose a plan to continue with full access.',
      urgency: 'critical',
    };
  }

  if (daysRemaining <= 3) {
    return {
      headline: `Only ${daysRemaining} days left`,
      subline: 'Choose your plan now to avoid any disruption.',
      urgency: 'critical',
    };
  }

  if (daysRemaining <= 7) {
    return {
      headline: `${daysRemaining} days remaining`,
      subline:
        valueScore > 50
          ? "You're making great progress — continue with a paid plan."
          : 'Time to explore the features before your trial ends.',
      urgency: 'warning',
    };
  }

  return {
    headline: `${daysRemaining} days in your trial`,
    subline: 'Full access to all features included.',
    urgency: 'info',
  };
}
