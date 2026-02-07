/**
 * Multi-Framework Rollup Service
 * Aggregates scores across multiple compliance frameworks for executive view
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateFrameworkReadiness, type FrameworkReadiness } from '@/lib/audit/readiness-calculator';
import type { FrameworkRollupItem, AuditReadinessForecast, AuditBlocker } from './types';

/**
 * Get framework rollup with historical trends
 */
export async function getMultiFrameworkRollup(
  orgId: string
): Promise<FrameworkRollupItem[]> {
  const admin = createSupabaseAdminClient();

  // Get current framework readiness
  const frameworkReadiness = await calculateFrameworkReadiness(orgId);

  // Get historical snapshots for trend calculation (30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: historicalSnapshots } = await admin
    .from('compliance_score_snapshots')
    .select('framework_slug, compliance_score')
    .eq('organization_id', orgId)
    .lte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: false });

  // Create a map of historical scores by framework code
  const historicalScoreMap = new Map<string, number>();
  for (const snapshot of historicalSnapshots || []) {
    const code = snapshot.framework_slug?.toUpperCase().replace('-', '_') || '';
    if (!historicalScoreMap.has(code)) {
      historicalScoreMap.set(code, snapshot.compliance_score);
    }
  }

  return frameworkReadiness.map((fw) => {
    const historicalScore = historicalScoreMap.get(fw.frameworkCode) ?? fw.readinessScore;
    const trend = fw.readinessScore - historicalScore;
    const trendDirection: 'up' | 'down' | 'stable' =
      trend > 2 ? 'up' : trend < -2 ? 'down' : 'stable';

    return {
      frameworkId: fw.frameworkId,
      code: fw.frameworkCode,
      title: fw.frameworkTitle,
      readinessScore: fw.readinessScore,
      controlsTotal: fw.totalControls,
      controlsSatisfied: fw.satisfiedControls,
      controlsPartial: fw.partialControls,
      controlsMissing: fw.missingControls,
      trend,
      trendDirection,
      weight: fw.totalControls,
      lastEvaluated: fw.evaluatedAt ?? undefined,
    };
  });
}

/**
 * Calculate audit readiness forecast
 */
export async function calculateAuditForecast(
  orgId: string,
  targetFrameworkCode?: string
): Promise<AuditReadinessForecast> {
  const admin = createSupabaseAdminClient();

  // Get current readiness
  const frameworkReadiness = await calculateFrameworkReadiness(orgId);

  // If specific framework requested, filter to it
  const targetFrameworks = targetFrameworkCode
    ? frameworkReadiness.filter((fw) => fw.frameworkCode === targetFrameworkCode)
    : frameworkReadiness;

  if (targetFrameworks.length === 0) {
    return {
      readinessScore: 0,
      targetScore: 80,
      estimatedReadyDate: null,
      weeksTillReady: null,
      blockers: [],
      recommendations: ['Enable at least one compliance framework to track audit readiness.'],
      improvementRate: 0,
    };
  }

  // Calculate combined score (weighted by controls)
  const totalWeight = targetFrameworks.reduce((sum, fw) => sum + fw.totalControls, 0);
  const currentScore =
    totalWeight > 0
      ? Math.round(
          targetFrameworks.reduce(
            (sum, fw) => sum + fw.readinessScore * fw.totalControls,
            0
          ) / totalWeight
        )
      : 0;

  // Get improvement rate from historical data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: historicalSnapshots } = await admin
    .from('org_compliance_snapshots')
    .select('compliance_score, captured_at')
    .eq('organization_id', orgId)
    .order('captured_at', { ascending: true })
    .limit(30);

  let improvementRate = 0;
  if (historicalSnapshots && historicalSnapshots.length >= 2) {
    const oldestScore = historicalSnapshots[0].compliance_score;
    const newestScore = historicalSnapshots[historicalSnapshots.length - 1].compliance_score;
    const daysDiff = Math.max(1, historicalSnapshots.length - 1);
    improvementRate = Math.round(((newestScore - oldestScore) / daysDiff) * 10) / 10;
  }

  // Calculate estimated ready date (target: 80%)
  const targetScore = 80;
  const pointsNeeded = targetScore - currentScore;
  let estimatedReadyDate: string | null = null;
  let weeksTillReady: number | null = null;

  if (currentScore >= targetScore) {
    estimatedReadyDate = new Date().toISOString();
    weeksTillReady = 0;
  } else if (improvementRate > 0) {
    const daysNeeded = Math.ceil(pointsNeeded / improvementRate);
    const readyDate = new Date();
    readyDate.setDate(readyDate.getDate() + daysNeeded);
    estimatedReadyDate = readyDate.toISOString();
    weeksTillReady = Math.ceil(daysNeeded / 7);
  }

  // Identify blockers (controls with low scores)
  const blockers = await getAuditBlockers(orgId, admin, targetFrameworks);

  // Generate recommendations
  const recommendations = generateRecommendations(currentScore, improvementRate, blockers);

  return {
    readinessScore: currentScore,
    targetScore,
    estimatedReadyDate,
    weeksTillReady,
    blockers,
    recommendations,
    improvementRate,
  };
}

/**
 * Get audit blockers (critical controls holding back readiness)
 */
async function getAuditBlockers(
  orgId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  frameworks: FrameworkReadiness[]
): Promise<AuditBlocker[]> {
  const frameworkIds = frameworks.map((fw) => fw.frameworkId);

  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select(`
      control_id,
      framework_id,
      compliance_score,
      gap_description
    `)
    .eq('organization_id', orgId)
    .eq('control_type', 'control_snapshot')
    .in('framework_id', frameworkIds)
    .lt('compliance_score', 50)
    .order('compliance_score', { ascending: true })
    .limit(5);

  if (!evaluations?.length) return [];

  // Get control details
  const controlIds = evaluations.map((e: { control_id?: string }) => e.control_id).filter(Boolean) as string[];
  const { data: controls } = await admin
    .from('compliance_controls')
    .select('id, code, title')
    .in('id', controlIds);

  const controlMap = new Map<string, { id: string; code: string; title: string }>(
    controls?.map((c: { id: string; code: string; title: string }) => [c.id, c]) || []
  );

  // Get framework map
  const frameworkMap = new Map(frameworks.map((fw) => [fw.frameworkId, fw]));

  return evaluations.map((eval_: { control_id: string; framework_id: string; compliance_score?: number; gap_description?: string }) => {
    const control = controlMap.get(eval_.control_id);
    const framework = frameworkMap.get(eval_.framework_id);
    const score = eval_.compliance_score ?? 0;

    return {
      controlCode: control?.code || 'UNKNOWN',
      controlTitle: control?.title || 'Unknown Control',
      framework: framework?.frameworkTitle || 'Unknown Framework',
      reason: eval_.gap_description || 'Evidence gap or control not implemented',
      priority: score < 25 ? 'critical' : score < 40 ? 'high' : 'medium',
      estimatedEffort:
        score < 25 ? 'high' : score < 40 ? 'medium' : 'low',
    } as AuditBlocker;
  });
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  currentScore: number,
  improvementRate: number,
  blockers: AuditBlocker[]
): string[] {
  const recommendations: string[] = [];

  if (currentScore < 50) {
    recommendations.push(
      'Focus on addressing critical control gaps before scheduling audits.'
    );
  } else if (currentScore < 70) {
    recommendations.push(
      'Increase evidence collection velocity to close remaining gaps.'
    );
  } else if (currentScore < 80) {
    recommendations.push(
      'Address the remaining partial controls to reach audit-ready status.'
    );
  } else {
    recommendations.push(
      'Maintain current compliance posture with regular evidence reviews.'
    );
  }

  if (improvementRate < 0.5 && currentScore < 80) {
    recommendations.push(
      'Consider automating evidence collection to accelerate progress.'
    );
  }

  if (blockers.length > 0) {
    const criticalCount = blockers.filter((b) => b.priority === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(
        `Prioritize ${criticalCount} critical control${criticalCount > 1 ? 's' : ''} blocking audit readiness.`
      );
    }
  }

  if (currentScore >= 80 && improvementRate > 0) {
    recommendations.push(
      'Consider scheduling an audit or certification review.'
    );
  }

  return recommendations;
}

/**
 * Get framework comparison for executive view
 */
export async function getFrameworkComparison(
  orgId: string
): Promise<{
  frameworks: Array<{
    code: string;
    title: string;
    currentScore: number;
    previousScore: number;
    trend: number;
    controlsCompliant: number;
    controlsTotal: number;
  }>;
  overallTrend: number;
}> {
  const rollup = await getMultiFrameworkRollup(orgId);

  const frameworks = rollup.map((fw) => ({
    code: fw.code,
    title: fw.title,
    currentScore: fw.readinessScore,
    previousScore: fw.readinessScore - fw.trend,
    trend: fw.trend,
    controlsCompliant: fw.controlsSatisfied,
    controlsTotal: fw.controlsTotal,
  }));

  const overallTrend =
    frameworks.length > 0
      ? Math.round(frameworks.reduce((sum, fw) => sum + fw.trend, 0) / frameworks.length)
      : 0;

  return { frameworks, overallTrend };
}
