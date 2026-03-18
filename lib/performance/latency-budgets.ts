/**
 * =========================================================
 * Latency Budget Tracking
 * =========================================================
 * SLA monitoring for API response times
 */

import { apiLogger } from '@/lib/observability/structured-logger';

export interface LatencyBudget {
  p95: number;  // 95th percentile target in ms
  p99: number;  // 99th percentile target in ms
}

/**
 * Latency budgets for key API endpoints (in milliseconds)
 */
export const LATENCY_BUDGETS: Record<string, LatencyBudget> = {
  // Executive dashboard APIs
  'executive/posture': { p95: 500, p99: 1000 },
  'executive/frameworks': { p95: 300, p99: 600 },
  'executive/audit-forecast': { p95: 400, p99: 800 },
  'executive/deadlines': { p95: 300, p99: 600 },

  // Care operations
  'care-operations/scorecard': { p95: 400, p99: 800 },
  'care-operations/credential-alerts': { p95: 300, p99: 600 },

  // Customer health
  'customer-health/score': { p95: 300, p99: 600 },
  'customer-health/rankings': { p95: 500, p99: 1000 },

  // Reports and exports
  'reports/export': { p95: 2000, p99: 5000 },
  'reports/generate': { p95: 3000, p99: 8000 },

  // Billing
  'billing/subscription': { p95: 300, p99: 600 },
  'billing/checkout': { p95: 1000, p99: 2000 },

  // Authentication
  'auth/session': { p95: 100, p99: 200 },
  'auth/verify': { p95: 200, p99: 400 },

  // General dashboard
  'dashboard/stats': { p95: 300, p99: 600 },
  'dashboard/tasks': { p95: 400, p99: 800 },
};

/**
 * Background job timeouts (in milliseconds)
 */
export const JOB_TIMEOUTS: Record<string, number> = {
  'compliance_score_update': 30000,      // 30s per org
  'evidence_expiry_check': 60000,        // 60s
  'billing_reconciliation': 120000,      // 2 min
  'entitlement_drift_check': 60000,      // 60s
  'report_generation': 180000,           // 3 min
  'enterprise_export': 300000,           // 5 min
  'default': 60000,                      // 1 min default
};

/**
 * Check if a latency violates the budget
 */
export function checkBudgetViolation(
  endpoint: string,
  latencyMs: number,
  percentile: 'p95' | 'p99' = 'p95'
): boolean {
  const budget = LATENCY_BUDGETS[endpoint];
  if (!budget) return false;

  return latencyMs > budget[percentile];
}

/**
 * Get budget for an endpoint
 */
export function getBudget(endpoint: string): LatencyBudget | null {
  return LATENCY_BUDGETS[endpoint] || null;
}

/**
 * Get timeout for a job type
 */
export function getJobTimeout(jobType: string): number {
  return JOB_TIMEOUTS[jobType] || JOB_TIMEOUTS.default;
}

/**
 * Log budget violations
 */
export function logBudgetViolation(
  endpoint: string,
  latencyMs: number,
  budget: LatencyBudget
): void {
  const severity = latencyMs > budget.p99 ? 'critical' : 'warning';

  apiLogger.warn(`latency_budget_exceeded:${endpoint}`, {
    latencyMs,
    p95Budget: budget.p95,
    p99Budget: budget.p99,
    severity,
    exceedsP95By: latencyMs - budget.p95,
    exceedsP99By: latencyMs > budget.p99 ? latencyMs - budget.p99 : 0,
  });
}

/**
 * Track and check latency against budget
 */
export function trackLatency(endpoint: string, latencyMs: number): {
  withinBudget: boolean;
  budget?: LatencyBudget;
} {
  const budget = getBudget(endpoint);

  if (!budget) {
    return { withinBudget: true };
  }

  const withinBudget = latencyMs <= budget.p95;

  if (!withinBudget) {
    logBudgetViolation(endpoint, latencyMs, budget);
  }

  return { withinBudget, budget };
}

/**
 * Wrap a function with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  jobName: string
): Promise<T | { timeout: true; jobName: string }> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<{ timeout: true; jobName: string }>((resolve) => {
    timeoutHandle = setTimeout(() => {
      apiLogger.warn(`job_timeout:${jobName}`, { timeoutMs });
      resolve({ timeout: true, jobName });
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Wrap a job with its configured timeout
 */
export async function withJobTimeout<T>(
  jobType: string,
  job: () => Promise<T>
): Promise<T | { timeout: true; jobName: string }> {
  const timeout = getJobTimeout(jobType);
  return withTimeout(job(), timeout, jobType);
}
