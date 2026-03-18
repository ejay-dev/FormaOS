/**
 * Customer Health Score Engine
 * Calculates org health scores for retention analytics
 */

import {
  CustomerHealthScore,
  HealthStatus,
  HealthFactors,
  HealthFactor,
  HealthAlert,
  HealthScoreInput,
  HEALTH_THRESHOLDS,
  HEALTH_FACTOR_MAX_SCORES,
  LOGIN_FREQUENCY_SCORES,
} from './health-types';

/**
 * Get health status from score
 */
export function getHealthStatus(score: number): HealthStatus {
  if (score >= HEALTH_THRESHOLDS.HEALTHY) return 'Healthy';
  if (score >= HEALTH_THRESHOLDS.WARNING) return 'Warning';
  if (score >= HEALTH_THRESHOLDS.AT_RISK) return 'At Risk';
  return 'Critical';
}

/**
 * Calculate login frequency score
 * Daily active = 25, Weekly = 15, Biweekly = 10, Monthly = 5, Inactive = 0
 */
function calculateLoginFrequencyScore(
  loginCountLast7Days: number,
  loginCountLast30Days: number
): HealthFactor {
  let score: number;
  let description: string;

  if (loginCountLast7Days >= 5) {
    score = LOGIN_FREQUENCY_SCORES.DAILY;
    description = 'Daily active user - excellent engagement';
  } else if (loginCountLast7Days >= 3) {
    score = LOGIN_FREQUENCY_SCORES.WEEKLY;
    description = 'Weekly active user - good engagement';
  } else if (loginCountLast30Days >= 4) {
    score = LOGIN_FREQUENCY_SCORES.BIWEEKLY;
    description = 'Biweekly active user - moderate engagement';
  } else if (loginCountLast30Days >= 1) {
    score = LOGIN_FREQUENCY_SCORES.MONTHLY;
    description = 'Monthly active user - low engagement';
  } else {
    score = LOGIN_FREQUENCY_SCORES.INACTIVE;
    description = 'Inactive user - no logins in 30 days';
  }

  return {
    score,
    maxScore: HEALTH_FACTOR_MAX_SCORES.LOGIN_FREQUENCY,
    percentage: Math.round((score / HEALTH_FACTOR_MAX_SCORES.LOGIN_FREQUENCY) * 100),
    description,
    dataPoints: [
      { label: 'Logins (7 days)', value: loginCountLast7Days },
      { label: 'Logins (30 days)', value: loginCountLast30Days },
    ],
  };
}

/**
 * Calculate feature adoption score
 * Based on percentage of available features used
 */
function calculateFeatureAdoptionScore(
  featuresUsed: string[],
  totalFeatures: number
): HealthFactor {
  const usedCount = featuresUsed.length;
  const adoptionRate = totalFeatures > 0 ? usedCount / totalFeatures : 0;
  const score = Math.round(adoptionRate * HEALTH_FACTOR_MAX_SCORES.FEATURE_ADOPTION);

  let description: string;
  if (adoptionRate >= 0.8) {
    description = 'Power user - using most features';
  } else if (adoptionRate >= 0.5) {
    description = 'Good adoption - using core features';
  } else if (adoptionRate >= 0.25) {
    description = 'Limited adoption - exploring features';
  } else {
    description = 'Low adoption - minimal feature usage';
  }

  return {
    score,
    maxScore: HEALTH_FACTOR_MAX_SCORES.FEATURE_ADOPTION,
    percentage: Math.round(adoptionRate * 100),
    description,
    dataPoints: [
      { label: 'Features used', value: usedCount },
      { label: 'Total features', value: totalFeatures },
    ],
  };
}

/**
 * Calculate compliance trend score
 * Based on improvement or decline in compliance score
 */
function calculateComplianceTrendScore(
  currentScore: number,
  previousScore: number,
  trendDays: number
): HealthFactor {
  const change = currentScore - previousScore;
  const changePercent = previousScore > 0 ? (change / previousScore) * 100 : 0;

  let score: number;
  let description: string;
  let trend: 'up' | 'down' | 'stable';

  if (change > 5) {
    score = 25;
    trend = 'up';
    description = `Improving - ${Math.abs(changePercent).toFixed(1)}% increase over ${trendDays} days`;
  } else if (change > 0) {
    score = 20;
    trend = 'up';
    description = `Slight improvement - ${Math.abs(changePercent).toFixed(1)}% increase`;
  } else if (change >= -2) {
    score = 15;
    trend = 'stable';
    description = 'Stable compliance score';
  } else if (change >= -10) {
    score = 10;
    trend = 'down';
    description = `Declining - ${Math.abs(changePercent).toFixed(1)}% decrease`;
  } else {
    score = 5;
    trend = 'down';
    description = `Significant decline - ${Math.abs(changePercent).toFixed(1)}% decrease`;
  }

  return {
    score,
    maxScore: HEALTH_FACTOR_MAX_SCORES.COMPLIANCE_TREND,
    percentage: Math.round((score / HEALTH_FACTOR_MAX_SCORES.COMPLIANCE_TREND) * 100),
    description,
    trend,
    dataPoints: [
      { label: 'Current score', value: currentScore },
      { label: 'Previous score', value: previousScore },
      { label: 'Change', value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` },
    ],
  };
}

/**
 * Calculate automation usage score
 * Based on workflow configuration and trigger frequency
 */
function calculateAutomationUsageScore(
  workflowsConfigured: number,
  workflowsTriggered: number
): HealthFactor {
  let score: number;
  let description: string;

  if (workflowsConfigured === 0) {
    score = 0;
    description = 'No workflows configured';
  } else {
    const triggerRate = workflowsTriggered / workflowsConfigured;
    if (triggerRate >= 10) {
      score = 15;
      description = 'Excellent automation - workflows actively triggering';
    } else if (triggerRate >= 5) {
      score = 12;
      description = 'Good automation usage';
    } else if (triggerRate >= 1) {
      score = 8;
      description = 'Moderate automation - some workflow activity';
    } else {
      score = 4;
      description = 'Low automation - workflows configured but rarely triggered';
    }
  }

  return {
    score,
    maxScore: HEALTH_FACTOR_MAX_SCORES.AUTOMATION_USAGE,
    percentage: Math.round((score / HEALTH_FACTOR_MAX_SCORES.AUTOMATION_USAGE) * 100),
    description,
    dataPoints: [
      { label: 'Workflows configured', value: workflowsConfigured },
      { label: 'Triggers (30 days)', value: workflowsTriggered },
    ],
  };
}

/**
 * Calculate overdue compliance penalty
 * -2 points per overdue item, max -10
 */
function calculateOverduePenalty(
  overdueTasksCount: number,
  overdueEvidenceCount: number,
  overdueReviewsCount: number
): HealthFactor {
  const totalOverdue = overdueTasksCount + overdueEvidenceCount + overdueReviewsCount;
  const penalty = Math.min(totalOverdue * 2, HEALTH_FACTOR_MAX_SCORES.OVERDUE_PENALTY);
  const score = HEALTH_FACTOR_MAX_SCORES.OVERDUE_PENALTY - penalty;

  let description: string;
  if (totalOverdue === 0) {
    description = 'No overdue items - excellent compliance';
  } else if (totalOverdue <= 2) {
    description = `${totalOverdue} overdue items - minor impact`;
  } else if (totalOverdue <= 5) {
    description = `${totalOverdue} overdue items - moderate concern`;
  } else {
    description = `${totalOverdue} overdue items - significant concern`;
  }

  return {
    score,
    maxScore: HEALTH_FACTOR_MAX_SCORES.OVERDUE_PENALTY,
    percentage: Math.round((score / HEALTH_FACTOR_MAX_SCORES.OVERDUE_PENALTY) * 100),
    description,
    dataPoints: [
      { label: 'Overdue tasks', value: overdueTasksCount },
      { label: 'Overdue evidence', value: overdueEvidenceCount },
      { label: 'Overdue reviews', value: overdueReviewsCount },
    ],
  };
}

/**
 * Generate health alerts based on factors
 */
function generateAlerts(
  factors: HealthFactors,
  input: HealthScoreInput
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const now = new Date().toISOString();

  // Login frequency alerts
  if (factors.loginFrequency.score === 0) {
    alerts.push({
      id: `login-inactive-${input.orgId}`,
      type: 'critical',
      category: 'login_activity',
      message: 'No user logins in the past 30 days',
      createdAt: now,
      acknowledged: false,
    });
  } else if (factors.loginFrequency.score <= 5) {
    alerts.push({
      id: `login-low-${input.orgId}`,
      type: 'warning',
      category: 'login_activity',
      message: 'Low login activity detected',
      createdAt: now,
      acknowledged: false,
    });
  }

  // Feature adoption alerts
  if (factors.featureAdoption.percentage < 25) {
    alerts.push({
      id: `adoption-low-${input.orgId}`,
      type: 'warning',
      category: 'feature_usage',
      message: 'Low feature adoption - users may not be getting full value',
      createdAt: now,
      acknowledged: false,
    });
  }

  // Compliance trend alerts
  if (factors.complianceTrend.trend === 'down') {
    alerts.push({
      id: `compliance-decline-${input.orgId}`,
      type: factors.complianceTrend.score <= 10 ? 'critical' : 'warning',
      category: 'compliance_decline',
      message: 'Compliance score is declining',
      createdAt: now,
      acknowledged: false,
    });
  }

  // Overdue items alerts
  const totalOverdue =
    input.overdueTasksCount + input.overdueEvidenceCount + input.overdueReviewsCount;
  if (totalOverdue >= 5) {
    alerts.push({
      id: `overdue-critical-${input.orgId}`,
      type: 'critical',
      category: 'overdue_items',
      message: `${totalOverdue} overdue compliance items require attention`,
      actionUrl: '/app/tasks?filter=overdue',
      createdAt: now,
      acknowledged: false,
    });
  } else if (totalOverdue >= 2) {
    alerts.push({
      id: `overdue-warning-${input.orgId}`,
      type: 'warning',
      category: 'overdue_items',
      message: `${totalOverdue} overdue compliance items`,
      actionUrl: '/app/tasks?filter=overdue',
      createdAt: now,
      acknowledged: false,
    });
  }

  // Trial expiring alert
  if (input.isTrialing && input.trialDaysRemaining !== null && input.trialDaysRemaining <= 3) {
    alerts.push({
      id: `trial-expiring-${input.orgId}`,
      type: input.trialDaysRemaining <= 1 ? 'critical' : 'warning',
      category: 'trial_expiring',
      message: `Trial expires in ${input.trialDaysRemaining} day${input.trialDaysRemaining === 1 ? '' : 's'}`,
      actionUrl: '/app/billing',
      createdAt: now,
      acknowledged: false,
    });
  }

  return alerts;
}

/**
 * Generate recommended actions based on factors
 */
function generateRecommendations(
  factors: HealthFactors,
  input: HealthScoreInput
): string[] {
  const recommendations: string[] = [];

  // Login frequency recommendations
  if (factors.loginFrequency.score <= 10) {
    recommendations.push('Schedule regular check-ins with the customer success team');
    recommendations.push('Send re-engagement email with product updates');
  }

  // Feature adoption recommendations
  if (factors.featureAdoption.percentage < 50) {
    recommendations.push('Offer personalized onboarding for unused features');
    if (!input.featuresUsed.includes('workflows')) {
      recommendations.push('Demonstrate workflow automation benefits');
    }
    if (!input.featuresUsed.includes('reports')) {
      recommendations.push('Show value of compliance reporting');
    }
  }

  // Compliance trend recommendations
  if (factors.complianceTrend.trend === 'down') {
    recommendations.push('Review control gaps and prioritize remediation');
    recommendations.push('Schedule compliance review meeting');
  }

  // Automation recommendations
  if (factors.automationUsage.score === 0) {
    recommendations.push('Set up first workflow automation');
  } else if (factors.automationUsage.score < 8) {
    recommendations.push('Optimize workflow triggers for better automation');
  }

  // Overdue items recommendations
  const totalOverdue =
    input.overdueTasksCount + input.overdueEvidenceCount + input.overdueReviewsCount;
  if (totalOverdue > 0) {
    recommendations.push('Address overdue compliance items immediately');
  }

  // Trial recommendations
  if (input.isTrialing) {
    recommendations.push('Highlight trial value and conversion benefits');
  }

  return recommendations;
}

/**
 * Main health score calculation function
 */
export function calculateHealthScore(input: HealthScoreInput): CustomerHealthScore {
  // Calculate all factors
  const factors: HealthFactors = {
    loginFrequency: calculateLoginFrequencyScore(
      input.loginCountLast7Days,
      input.loginCountLast30Days
    ),
    featureAdoption: calculateFeatureAdoptionScore(
      input.featuresUsed,
      input.totalFeatures
    ),
    complianceTrend: calculateComplianceTrendScore(
      input.currentComplianceScore,
      input.previousComplianceScore,
      input.complianceTrendDays
    ),
    automationUsage: calculateAutomationUsageScore(
      input.workflowsConfigured,
      input.workflowsTriggeredLast30Days
    ),
    overdueCompliance: calculateOverduePenalty(
      input.overdueTasksCount,
      input.overdueEvidenceCount,
      input.overdueReviewsCount
    ),
  };

  // Calculate total score
  const totalScore =
    factors.loginFrequency.score +
    factors.featureAdoption.score +
    factors.complianceTrend.score +
    factors.automationUsage.score +
    factors.overdueCompliance.score;

  // Clamp score between 0-100
  const score = Math.max(0, Math.min(100, totalScore));

  // Generate alerts and recommendations
  const alerts = generateAlerts(factors, input);
  const recommendedActions = generateRecommendations(factors, input);

  const now = new Date().toISOString();

  return {
    orgId: input.orgId,
    orgName: input.orgName,
    industry: input.industry,
    plan: input.plan,
    status: getHealthStatus(score),
    score,
    factors,
    lastActivity: input.lastLoginAt || now,
    lastLoginAt: input.lastLoginAt,
    trialDaysRemaining: input.trialDaysRemaining,
    isTrialing: input.isTrialing,
    memberCount: input.memberCount,
    alerts,
    recommendedActions,
    createdAt: input.createdAt,
    calculatedAt: now,
  };
}

/**
 * Get status color for UI
 */
export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'Healthy':
      return 'emerald';
    case 'Warning':
      return 'amber';
    case 'At Risk':
      return 'orange';
    case 'Critical':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get status icon name for UI
 */
export function getHealthStatusIcon(status: HealthStatus): string {
  switch (status) {
    case 'Healthy':
      return 'CheckCircle';
    case 'Warning':
      return 'AlertTriangle';
    case 'At Risk':
      return 'AlertCircle';
    case 'Critical':
      return 'XCircle';
    default:
      return 'Circle';
  }
}
