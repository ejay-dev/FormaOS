/**
 * Tests for lib/observability/enterprise-monitor.ts
 */

import {
  enterpriseMonitor,
  type APIMetrics,
  type Alert,
} from '@/lib/observability/enterprise-monitor';

jest.mock('@/lib/observability/structured-logger', () => ({
  logStructured: jest.fn(),
}));

beforeEach(() => {
  enterpriseMonitor.reset();
});

describe('EnterpriseMonitor', () => {
  describe('trackAPICall', () => {
    it('tracks a successful API call', () => {
      enterpriseMonitor.trackAPICall('auth', '/login', 100, 200);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis).toHaveLength(1);
      expect(snapshot.apis[0].calls).toBe(1);
      expect(snapshot.apis[0].errors).toBe(0);
      expect(snapshot.apis[0].consecutiveFailures).toBe(0);
    });

    it('tracks a failed API call (4xx)', () => {
      enterpriseMonitor.trackAPICall('auth', '/login', 200, 401, {
        code: 'UNAUTHORIZED',
        message: 'Bad token',
      });
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis[0].errors).toBe(1);
      expect(snapshot.apis[0].consecutiveFailures).toBe(1);
      expect(snapshot.apis[0].lastError).toBeTruthy();
    });

    it('tracks a failed API call (5xx)', () => {
      enterpriseMonitor.trackAPICall('auth', '/login', 500, 500);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis[0].errors).toBe(1);
      expect(snapshot.apis[0].lastError!.code).toBe('HTTP_500');
    });

    it('resets consecutive failures on success', () => {
      enterpriseMonitor.trackAPICall('auth', '/login', 100, 500);
      enterpriseMonitor.trackAPICall('auth', '/login', 100, 500);
      enterpriseMonitor.trackAPICall('auth', '/login', 100, 200);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis[0].consecutiveFailures).toBe(0);
    });

    it('keeps max latency samples', () => {
      for (let i = 0; i < 150; i++) {
        enterpriseMonitor.trackAPICall('auth', '/api', i, 200);
      }
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis[0].latencies.length).toBeLessThanOrEqual(100);
    });

    it('accumulates total duration', () => {
      enterpriseMonitor.trackAPICall('auth', '/api', 100, 200);
      enterpriseMonitor.trackAPICall('auth', '/api', 200, 200);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.apis[0].totalDuration).toBe(300);
    });
  });

  describe('trackBackgroundJob', () => {
    it('tracks a successful job', () => {
      enterpriseMonitor.trackBackgroundJob('sync', true, 500);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.jobs).toHaveLength(1);
      expect(snapshot.jobs[0].successes).toBe(1);
      expect(snapshot.jobs[0].failures).toBe(0);
    });

    it('tracks a failed job', () => {
      enterpriseMonitor.trackBackgroundJob('sync', false, 100, {
        code: 'TIMEOUT',
        message: 'timed out',
      });
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.jobs[0].failures).toBe(1);
      expect(snapshot.jobs[0].lastRun!.success).toBe(false);
    });

    it('accumulates total duration and runs', () => {
      enterpriseMonitor.trackBackgroundJob('sync', true, 100);
      enterpriseMonitor.trackBackgroundJob('sync', false, 200);
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.jobs[0].runs).toBe(2);
      expect(snapshot.jobs[0].totalDuration).toBe(300);
    });
  });

  describe('alert conditions', () => {
    it('generates error rate warning when > 5%', () => {
      // Need > 10 calls for error rate to be checked
      for (let i = 0; i < 10; i++) {
        enterpriseMonitor.trackAPICall('auth', '/test', 50, 200);
      }
      enterpriseMonitor.trackAPICall('auth', '/test', 50, 500);
      const alerts = enterpriseMonitor.getAlerts();
      expect(alerts.some((a) => a.type === 'error_rate')).toBe(true);
    });

    it('generates critical error rate when > 10%', () => {
      for (let i = 0; i < 10; i++) {
        enterpriseMonitor.trackAPICall('auth', '/test', 50, 200);
      }
      // Add 2 errors to push past 10%
      enterpriseMonitor.trackAPICall('auth', '/test', 50, 500);
      enterpriseMonitor.trackAPICall('auth', '/test', 50, 500);
      const alerts = enterpriseMonitor.getAlerts();
      const errAlert = alerts.find((a) => a.type === 'error_rate');
      expect(errAlert?.severity).toBe('critical');
    });

    it('generates latency alert when p95 > 1000ms', () => {
      for (let i = 0; i < 20; i++) {
        enterpriseMonitor.trackAPICall('auth', '/slow', 1500, 200);
      }
      const alerts = enterpriseMonitor.getAlerts();
      expect(alerts.some((a) => a.type === 'latency')).toBe(true);
    });

    it('generates critical latency when p95 > 2000ms', () => {
      for (let i = 0; i < 20; i++) {
        enterpriseMonitor.trackAPICall('auth', '/slow', 2500, 200);
      }
      const alerts = enterpriseMonitor.getAlerts();
      const latAlert = alerts.find((a) => a.type === 'latency');
      expect(latAlert?.severity).toBe('critical');
    });

    it('generates failure streak alert after 3 consecutive failures', () => {
      enterpriseMonitor.trackAPICall('auth', '/fail', 50, 500);
      enterpriseMonitor.trackAPICall('auth', '/fail', 50, 500);
      enterpriseMonitor.trackAPICall('auth', '/fail', 50, 500);
      const alerts = enterpriseMonitor.getAlerts();
      expect(alerts.some((a) => a.type === 'failure_streak')).toBe(true);
    });

    it('generates job failure alert when rate > 10%', () => {
      for (let i = 0; i < 5; i++) {
        enterpriseMonitor.trackBackgroundJob('sync', true, 100);
      }
      enterpriseMonitor.trackBackgroundJob('sync', false, 100);
      const alerts = enterpriseMonitor.getAlerts();
      expect(alerts.some((a) => a.type === 'job_failure')).toBe(true);
    });

    it('generates critical job failure when rate > 20%', () => {
      for (let i = 0; i < 5; i++) {
        enterpriseMonitor.trackBackgroundJob('sync', true, 100);
      }
      enterpriseMonitor.trackBackgroundJob('sync', false, 100);
      enterpriseMonitor.trackBackgroundJob('sync', false, 100);
      const alerts = enterpriseMonitor.getAlerts();
      const jobAlert = alerts.find((a) => a.type === 'job_failure');
      expect(jobAlert?.severity).toBe('critical');
    });

    it('deduplicates alerts by type/domain/endpoint', () => {
      for (let i = 0; i < 15; i++) {
        enterpriseMonitor.trackAPICall('auth', '/test', 50, 500);
      }
      const alerts = enterpriseMonitor.getAlerts();
      const errAlerts = alerts.filter(
        (a) => a.type === 'error_rate' && a.endpoint === '/test',
      );
      expect(errAlerts.length).toBe(1);
    });
  });

  describe('exportMetrics', () => {
    it('computes summary statistics', () => {
      enterpriseMonitor.trackAPICall('auth', '/a', 100, 200);
      enterpriseMonitor.trackAPICall('auth', '/b', 200, 500);
      enterpriseMonitor.trackBackgroundJob('job1', true, 50);
      enterpriseMonitor.trackBackgroundJob('job2', false, 100);

      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.summary.totalAPICalls).toBe(2);
      expect(snapshot.summary.totalAPIErrors).toBe(1);
      expect(snapshot.summary.overallErrorRate).toBe(0.5);
      expect(snapshot.summary.avgLatency).toBe(150);
      expect(snapshot.summary.totalJobRuns).toBe(2);
      expect(snapshot.summary.totalJobFailures).toBe(1);
    });

    it('returns 0 values when no data', () => {
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.summary.overallErrorRate).toBe(0);
      expect(snapshot.summary.avgLatency).toBe(0);
      expect(snapshot.summary.p95Latency).toBe(0);
    });

    it('computes p95 latency across all apis', () => {
      for (let i = 1; i <= 20; i++) {
        enterpriseMonitor.trackAPICall('auth', '/test', i * 10, 200);
      }
      const snapshot = enterpriseMonitor.exportMetrics();
      expect(snapshot.summary.p95Latency).toBeGreaterThan(0);
    });
  });
});
