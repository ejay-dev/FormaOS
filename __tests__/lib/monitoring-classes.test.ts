/** @jest-environment node */

jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  RBACMonitor,
  APIHealthMonitor,
  PerformanceMonitor,
} from '@/lib/monitoring';

describe('lib/monitoring', () => {
  describe('RBACMonitor', () => {
    let monitor: RBACMonitor;

    beforeEach(() => {
      monitor = new RBACMonitor();
    });

    it('tracks successful permission checks', () => {
      monitor.trackPermissionCheck('admin', 'read', true, 5);
      const metrics = monitor.getMetrics();
      expect(metrics.rbacChecks.total).toBe(1);
      expect(metrics.rbacChecks.failures).toBe(0);
      expect(metrics.rbacChecks.avgDuration).toBe(5);
    });

    it('tracks denied permission checks', () => {
      monitor.trackPermissionCheck('member', 'delete', false, 10);
      const metrics = monitor.getMetrics();
      expect(metrics.rbacChecks.total).toBe(1);
      expect(metrics.rbacChecks.failures).toBe(1);
      expect(metrics.permissionDenials).toBe(1);
    });

    it('correctly averages durations across multiple checks', () => {
      monitor.trackPermissionCheck('admin', 'read', true, 10);
      monitor.trackPermissionCheck('admin', 'write', true, 20);
      monitor.trackPermissionCheck('member', 'delete', false, 30);
      const metrics = monitor.getMetrics();
      expect(metrics.rbacChecks.total).toBe(3);
      expect(metrics.rbacChecks.avgDuration).toBe(20);
      expect(metrics.rbacChecks.failures).toBe(1);
    });

    it('tracks role changes', () => {
      monitor.trackRoleChange('u1', 'member', 'admin', 'u2');
      const metrics = monitor.getMetrics();
      expect(metrics.roleChangeEvents).toBe(1);
    });

    it('returns zero avg duration when no checks', () => {
      expect(monitor.getMetrics().rbacChecks.avgDuration).toBe(0);
    });

    it('logs events in production', () => {
      const prev = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      monitor.trackPermissionCheck('admin', 'read', true, 1);
      (process.env as any).NODE_ENV = prev;
    });
  });

  describe('APIHealthMonitor', () => {
    let monitor: APIHealthMonitor;

    beforeEach(() => {
      monitor = new APIHealthMonitor();
    });

    it('tracks successful requests', () => {
      monitor.trackRequest('GET', '/api/health', 200, 50);
      const health = monitor.getHealth();
      expect(health.totalRequests).toBe(1);
      expect(health.totalErrors).toBe(0);
    });

    it('tracks error requests (4xx)', () => {
      monitor.trackRequest('POST', '/api/users', 400, 30, 'Bad request');
      const health = monitor.getHealth();
      expect(health.totalErrors).toBe(1);
    });

    it('tracks error requests (5xx)', () => {
      monitor.trackRequest('GET', '/api/data', 500, 100, 'Server error');
      const health = monitor.getHealth();
      expect(health.totalErrors).toBe(1);
    });

    it('calculates error rate and avg response time', () => {
      monitor.trackRequest('GET', '/api/a', 200, 100);
      monitor.trackRequest('GET', '/api/b', 500, 200);
      const health = monitor.getHealth();
      expect(Number(health.errorRate)).toBe(50);
      expect(Number(health.avgResponseTime)).toBe(150);
      expect(health.uptime).toBe(50);
    });

    it('returns zero metrics when no requests', () => {
      const health = monitor.getHealth();
      expect(health.uptime).toBe(100);
      expect(Number(health.avgResponseTime)).toBe(0);
    });

    it('tracks per-endpoint metrics', () => {
      monitor.trackRequest('GET', '/api/a', 200, 50);
      monitor.trackRequest('GET', '/api/a', 200, 100);
      monitor.trackRequest('GET', '/api/a', 500, 200, 'err');
      const health = monitor.getHealth();
      const endpoint = health.endpoints.find((e) => e.path === '/api/a');
      expect(endpoint).toBeDefined();
      expect(endpoint!.calls).toBe(3);
      expect(endpoint!.errors).toBe(1);
    });

    it('alerts on high error rate endpoints', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      // 2 errors out of 3 calls > 10%
      monitor.trackRequest('POST', '/api/fail', 500, 10, 'e1');
      monitor.trackRequest('POST', '/api/fail', 500, 10, 'e2');
      monitor.trackRequest('POST', '/api/fail', 200, 10);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[ALERT]'),
        expect.any(String),
      );
      spy.mockRestore();
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('tracks page load metrics', () => {
      monitor.trackPageLoad('/dashboard', 500, 200, 800, 50_000_000);
      const metrics = monitor.getPageMetrics('/dashboard');
      expect(metrics).not.toBeNull();
      expect(metrics!.sampleSize).toBe(1);
    });

    it('returns null for unknown pages', () => {
      expect(monitor.getPageMetrics('/unknown')).toBeNull();
    });

    it('averages multiple page loads', () => {
      monitor.trackPageLoad('/app', 100, 50, 200, 10_000_000);
      monitor.trackPageLoad('/app', 300, 150, 400, 30_000_000);
      const metrics = monitor.getPageMetrics('/app');
      expect(metrics!.sampleSize).toBe(2);
      expect(Number(metrics!.avgRenderTime)).toBe(200);
      expect(metrics!.maxRenderTime).toBe(300);
      expect(metrics!.minRenderTime).toBe(100);
    });

    it('alerts on slow page loads (>3000ms)', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      monitor.trackPageLoad('/slow', 3500, 100, 200, 1_000_000);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[ALERT]'),
        expect.any(String),
      );
      spy.mockRestore();
    });

    it('caps history at 100 entries', () => {
      for (let i = 0; i < 110; i++) {
        monitor.trackPageLoad('/stress', 100 + i, 50, 200, 1_000_000);
      }
      const metrics = monitor.getPageMetrics('/stress');
      expect(metrics!.sampleSize).toBe(100);
    });
  });
});
