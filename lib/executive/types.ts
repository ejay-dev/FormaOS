/**
 * Executive Compliance Dashboard Types
 * Types for C-level visibility into organization-wide compliance posture
 */

export interface ExecutivePosture {
  overallScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  frameworkCoverage: number;
  automationEffectiveness: number;
  criticalFailures: CriticalControl[];
  upcomingDeadlines: ComplianceDeadline[];
  frameworkRollup: FrameworkRollupItem[];
  lastEvaluated: string;
}

export interface CriticalControl {
  id: string;
  controlCode: string;
  title: string;
  framework: string;
  frameworkCode: string;
  status: 'critical' | 'high' | 'medium';
  owner?: ControlOwner;
  dueDate?: string;
  lastEvaluated: string;
  gapDescription?: string;
  evidenceCount: number;
  requiredEvidence: number;
}

export interface ControlOwner {
  userId: string;
  name: string;
  email: string;
  role?: string;
}

export interface ComplianceDeadline {
  id: string;
  title: string;
  description?: string;
  framework?: string;
  frameworkSlug?: string;
  dueDate: string;
  reminderDate?: string;
  type: DeadlineType;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  assignedTo?: ControlOwner;
  daysRemaining: number;
}

export type DeadlineType = 'audit' | 'renewal' | 'review' | 'submission' | 'certification' | 'other';
export type DeadlinePriority = 'low' | 'medium' | 'high' | 'critical';
export type DeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'cancelled';

export interface FrameworkRollupItem {
  frameworkId: string;
  code: string;
  title: string;
  readinessScore: number;
  controlsTotal: number;
  controlsSatisfied: number;
  controlsPartial: number;
  controlsMissing: number;
  trend: number;
  trendDirection: 'up' | 'down' | 'stable';
  weight: number;
  lastEvaluated?: string;
}

export interface AuditReadinessForecast {
  readinessScore: number;
  targetScore: number;
  estimatedReadyDate: string | null;
  weeksTillReady: number | null;
  blockers: AuditBlocker[];
  recommendations: string[];
  improvementRate: number;
}

export interface AuditBlocker {
  controlCode: string;
  controlTitle: string;
  framework: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface AutomationMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  triggersThisWeek: number;
  triggersThisMonth: number;
  successRate: number;
  taskAutoCompletionRate: number;
  averageResolutionTime: number;
}

export interface ExecutiveAPIResponse {
  posture: ExecutivePosture;
  auditForecast: AuditReadinessForecast;
  automationMetrics: AutomationMetrics;
  generatedAt: string;
}
