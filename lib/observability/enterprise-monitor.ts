/**
 * =========================================================
 * Enterprise Monitor
 * =========================================================
 * Centralized metrics tracking for API health, background jobs,
 * and alert condition monitoring
 */

import { logStructured, type LogDomain } from './structured-logger';

export interface APIMetrics {
  domain: string;
  endpoint: string;
  calls: number;
  errors: number;
  totalDuration: number;
  latencies: number[];
  lastError?: { timestamp: string; message: string; code: string };
  consecutiveFailures: number;
}

export interface JobMetrics {
  jobName: string;
  runs: number;
  successes: number;
  failures: number;
  totalDuration: number;
  lastRun?: { timestamp: string; success: boolean; duration: number };
}

export interface Alert {
  id: string;
  type: 'error_rate' | 'latency' | 'failure_streak' | 'job_failure';
  severity: 'warning' | 'critical';
  domain: string;
  endpoint?: string;
  jobName?: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export interface MetricsSnapshot {
  timestamp: string;
  apis: APIMetrics[];
  jobs: JobMetrics[];
  alerts: Alert[];
  summary: {
    totalAPICalls: number;
    totalAPIErrors: number;
    overallErrorRate: number;
    avgLatency: number;
    p95Latency: number;
    totalJobRuns: number;
    totalJobFailures: number;
  };
}

const THRESHOLDS = {
  errorRate: 0.05,       // 5% error rate triggers alert
  latencyP95: 1000,      // 1s p95 latency threshold
  failureStreak: 3,      // 3 consecutive failures
  jobFailureRate: 0.1,   // 10% job failure rate
};

// Maximum latency samples to keep for P95 calculation
const MAX_LATENCY_SAMPLES = 100;

class EnterpriseMonitor {
  private apiMetrics: Map<string, APIMetrics> = new Map();
  private jobMetrics: Map<string, JobMetrics> = new Map();
  private alerts: Alert[] = [];
  private alertIdCounter = 0;

  /**
   * Track an API call
   */
  trackAPICall(
    domain: LogDomain,
    endpoint: string,
    duration: number,
    status: number,
    error?: { code: string; message: string }
  ): void {
    const key = `${domain}:${endpoint}`;
    const isError = status >= 400;

    let metrics = this.apiMetrics.get(key);
    if (!metrics) {
      metrics = {
        domain,
        endpoint,
        calls: 0,
        errors: 0,
        totalDuration: 0,
        latencies: [],
        consecutiveFailures: 0,
      };
    }

    metrics.calls++;
    metrics.totalDuration += duration;

    // Keep last N latencies for P95 calculation
    metrics.latencies.push(duration);
    if (metrics.latencies.length > MAX_LATENCY_SAMPLES) {
      metrics.latencies.shift();
    }

    if (isError) {
      metrics.errors++;
      metrics.consecutiveFailures++;
      metrics.lastError = {
        timestamp: new Date().toISOString(),
        message: error?.message || `HTTP ${status}`,
        code: error?.code || `HTTP_${status}`,
      };
    } else {
      metrics.consecutiveFailures = 0;
    }

    this.apiMetrics.set(key, metrics);

    // Check alert conditions
    this.checkAPIAlerts(metrics);
  }

  /**
   * Track a background job execution
   */
  trackBackgroundJob(
    jobName: string,
    success: boolean,
    duration: number,
    error?: { code: string; message: string }
  ): void {
    let metrics = this.jobMetrics.get(jobName);
    if (!metrics) {
      metrics = {
        jobName,
        runs: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
      };
    }

    metrics.runs++;
    metrics.totalDuration += duration;

    if (success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }

    metrics.lastRun = {
      timestamp: new Date().toISOString(),
      success,
      duration,
    };

    this.jobMetrics.set(jobName, metrics);

    // Log job completion
    if (!success) {
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'error',
        domain: 'automation',
        action: `job_failed:${jobName}`,
        duration,
        error,
      });

      this.checkJobAlerts(metrics);
    }
  }

  /**
   * Check API alert conditions
   */
  private checkAPIAlerts(metrics: APIMetrics): void {
    const errorRate = metrics.calls > 10 ? metrics.errors / metrics.calls : 0;
    const p95 = this.calculateP95(metrics.latencies);

    // Error rate alert
    if (errorRate > THRESHOLDS.errorRate) {
      this.addAlert({
        type: 'error_rate',
        severity: errorRate > 0.1 ? 'critical' : 'warning',
        domain: metrics.domain,
        endpoint: metrics.endpoint,
        message: `High error rate on ${metrics.domain}/${metrics.endpoint}: ${(errorRate * 100).toFixed(1)}%`,
        value: errorRate,
        threshold: THRESHOLDS.errorRate,
      });
    }

    // Latency alert
    if (p95 > THRESHOLDS.latencyP95) {
      this.addAlert({
        type: 'latency',
        severity: p95 > THRESHOLDS.latencyP95 * 2 ? 'critical' : 'warning',
        domain: metrics.domain,
        endpoint: metrics.endpoint,
        message: `High P95 latency on ${metrics.domain}/${metrics.endpoint}: ${p95.toFixed(0)}ms`,
        value: p95,
        threshold: THRESHOLDS.latencyP95,
      });
    }

    // Consecutive failure streak
    if (metrics.consecutiveFailures >= THRESHOLDS.failureStreak) {
      this.addAlert({
        type: 'failure_streak',
        severity: 'critical',
        domain: metrics.domain,
        endpoint: metrics.endpoint,
        message: `Failure streak on ${metrics.domain}/${metrics.endpoint}: ${metrics.consecutiveFailures} consecutive failures`,
        value: metrics.consecutiveFailures,
        threshold: THRESHOLDS.failureStreak,
      });
    }
  }

  /**
   * Check job alert conditions
   */
  private checkJobAlerts(metrics: JobMetrics): void {
    const failureRate = metrics.runs > 5 ? metrics.failures / metrics.runs : 0;

    if (failureRate > THRESHOLDS.jobFailureRate) {
      this.addAlert({
        type: 'job_failure',
        severity: failureRate > 0.2 ? 'critical' : 'warning',
        domain: 'automation',
        jobName: metrics.jobName,
        message: `High job failure rate for ${metrics.jobName}: ${(failureRate * 100).toFixed(1)}%`,
        value: failureRate,
        threshold: THRESHOLDS.jobFailureRate,
      });
    }
  }

  /**
   * Add an alert (deduplicates by type/domain/endpoint)
   */
  private addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const key = `${alert.type}:${alert.domain}:${alert.endpoint || ''}:${alert.jobName || ''}`;

    // Remove existing alert of same type
    this.alerts = this.alerts.filter(a =>
      `${a.type}:${a.domain}:${a.endpoint || ''}:${a.jobName || ''}` !== key
    );

    this.alerts.push({
      ...alert,
      id: `alert_${++this.alertIdCounter}`,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'critical',
        domain: alert.domain as LogDomain,
        action: `alert:${alert.type}`,
        metadata: {
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
        },
      });
    }
  }

  /**
   * Calculate P95 latency
   */
  private calculateP95(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || sorted[sorted.length - 1];
  }

  /**
   * Get current alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Export metrics snapshot
   */
  exportMetrics(): MetricsSnapshot {
    const apis = Array.from(this.apiMetrics.values());
    const jobs = Array.from(this.jobMetrics.values());

    // Calculate summary
    const totalAPICalls = apis.reduce((sum, m) => sum + m.calls, 0);
    const totalAPIErrors = apis.reduce((sum, m) => sum + m.errors, 0);
    const totalDuration = apis.reduce((sum, m) => sum + m.totalDuration, 0);
    const allLatencies = apis.flatMap(m => m.latencies);

    const totalJobRuns = jobs.reduce((sum, m) => sum + m.runs, 0);
    const totalJobFailures = jobs.reduce((sum, m) => sum + m.failures, 0);

    return {
      timestamp: new Date().toISOString(),
      apis,
      jobs,
      alerts: this.getAlerts(),
      summary: {
        totalAPICalls,
        totalAPIErrors,
        overallErrorRate: totalAPICalls > 0 ? totalAPIErrors / totalAPICalls : 0,
        avgLatency: totalAPICalls > 0 ? totalDuration / totalAPICalls : 0,
        p95Latency: this.calculateP95(allLatencies),
        totalJobRuns,
        totalJobFailures,
      },
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.apiMetrics.clear();
    this.jobMetrics.clear();
    this.alerts = [];
  }
}

// Export singleton instance
export const enterpriseMonitor = new EnterpriseMonitor();
