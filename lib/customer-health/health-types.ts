/**
 * Customer Health Score Engine Types
 * Types for retention analytics and org health classification
 */

export type HealthStatus = 'Healthy' | 'Warning' | 'At Risk' | 'Critical';

// =========================================================
// Health Score
// =========================================================

export interface CustomerHealthScore {
  orgId: string;
  orgName: string;
  industry: string | null;
  plan: string;
  status: HealthStatus;
  score: number;
  factors: HealthFactors;
  lastActivity: string;
  lastLoginAt: string | null;
  trialDaysRemaining: number | null;
  isTrialing: boolean;
  memberCount: number;
  alerts: HealthAlert[];
  recommendedActions: string[];
  createdAt: string;
  calculatedAt: string;
}

// =========================================================
// Health Factors
// =========================================================

export interface HealthFactors {
  loginFrequency: HealthFactor;
  featureAdoption: HealthFactor;
  complianceTrend: HealthFactor;
  automationUsage: HealthFactor;
  overdueCompliance: HealthFactor;
}

export interface HealthFactor {
  score: number;
  maxScore: number;
  percentage: number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  dataPoints?: HealthDataPoint[];
}

export interface HealthDataPoint {
  label: string;
  value: number | string;
  timestamp?: string;
}

// =========================================================
// Alerts
// =========================================================

export interface HealthAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: HealthAlertCategory;
  message: string;
  actionUrl?: string;
  createdAt: string;
  acknowledged: boolean;
}

export type HealthAlertCategory =
  | 'login_activity'
  | 'feature_usage'
  | 'compliance_decline'
  | 'automation_issues'
  | 'overdue_items'
  | 'trial_expiring'
  | 'subscription';

// =========================================================
// Scoring Thresholds
// =========================================================

export const HEALTH_THRESHOLDS = {
  HEALTHY: 75,
  WARNING: 50,
  AT_RISK: 25,
  CRITICAL: 0,
} as const;

export const HEALTH_FACTOR_MAX_SCORES = {
  LOGIN_FREQUENCY: 25,
  FEATURE_ADOPTION: 25,
  COMPLIANCE_TREND: 25,
  AUTOMATION_USAGE: 15,
  OVERDUE_PENALTY: 10,
} as const;

export const LOGIN_FREQUENCY_SCORES = {
  DAILY: 25,
  WEEKLY: 15,
  BIWEEKLY: 10,
  MONTHLY: 5,
  INACTIVE: 0,
} as const;

// =========================================================
// Rankings (Founder View)
// =========================================================

export interface HealthRankings {
  organizations: CustomerHealthScore[];
  summary: HealthSummary;
  calculatedAt: string;
}

export interface HealthSummary {
  total: number;
  healthy: number;
  warning: number;
  atRisk: number;
  critical: number;
  averageScore: number;
  trialing: number;
  activeSubscriptions: number;
}

// =========================================================
// API Responses
// =========================================================

export interface HealthScoreAPIResponse {
  healthScore: CustomerHealthScore;
  generatedAt: string;
}

export interface HealthRankingsAPIResponse {
  rankings: HealthRankings;
  generatedAt: string;
}

// =========================================================
// Calculation Input
// =========================================================

export interface HealthScoreInput {
  orgId: string;
  orgName: string;
  industry: string | null;
  plan: string;
  createdAt: string;
  memberCount: number;

  // Activity data
  lastLoginAt: string | null;
  loginCountLast7Days: number;
  loginCountLast30Days: number;

  // Feature usage
  featuresUsed: string[];
  totalFeatures: number;

  // Compliance data
  currentComplianceScore: number;
  previousComplianceScore: number;
  complianceTrendDays: number;

  // Automation data
  workflowsConfigured: number;
  workflowsTriggeredLast30Days: number;

  // Overdue items
  overdueTasksCount: number;
  overdueEvidenceCount: number;
  overdueReviewsCount: number;

  // Trial data
  isTrialing: boolean;
  trialDaysRemaining: number | null;
}

// =========================================================
// Utility Functions Type
// =========================================================

export type CalculateHealthScore = (input: HealthScoreInput) => CustomerHealthScore;

export type GetHealthStatus = (score: number) => HealthStatus;
