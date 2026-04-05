import { getPerformanceMonitor } from '@/lib/monitoring/performance';

// Provide mock for PerformanceObserver in jsdom
const mockPerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));
global.PerformanceObserver = mockPerformanceObserver as any;

describe('PerformanceMonitor', () => {
  const monitor = getPerformanceMonitor();

  describe('getMetrics', () => {
    it('returns an array', () => {
      expect(Array.isArray(monitor.getMetrics())).toBe(true);
    });

    it('returns a copy not the internal reference', () => {
      const m1 = monitor.getMetrics();
      const m2 = monitor.getMetrics();
      expect(m1).not.toBe(m2);
    });
  });

  describe('recordMetric', () => {
    it('adds a metric to the store', () => {
      const before = monitor.getMetrics().length;
      monitor.recordMetric({
        name: 'TEST_METRIC_A',
        value: 1200,
        timestamp: Date.now(),
        sessionId: 'test',
      });
      expect(monitor.getMetrics().length).toBe(before + 1);
    });

    it('stores additional metrics', () => {
      const before = monitor.getMetrics().length;
      monitor.recordMetric({
        name: 'TEST_B1',
        value: 1,
        timestamp: Date.now(),
      });
      monitor.recordMetric({
        name: 'TEST_B2',
        value: 2,
        timestamp: Date.now(),
      });
      expect(monitor.getMetrics().length).toBe(before + 2);
    });
  });

  describe('timeOperation', () => {
    it('records timing for successful operation', async () => {
      const before = monitor.getMetrics().length;
      const result = await monitor.timeOperation('perf-success', async () => {
        return 42;
      });
      expect(result).toBe(42);
      expect(monitor.getMetrics().length).toBe(before + 1);
    });

    it('records timing for failed operation and re-throws', async () => {
      const before = monitor.getMetrics().length;
      await expect(
        monitor.timeOperation('perf-fail', async () => {
          throw new Error('fail');
        }),
      ).rejects.toThrow('fail');
      expect(monitor.getMetrics().length).toBe(before + 1);
    });
  });

  describe('getSummary', () => {
    it('returns summary with session info and metric types', () => {
      const summary = monitor.getSummary();
      expect(summary.sessionId).toBeTruthy();
      expect(typeof summary.totalMetrics).toBe('number');
      expect(Array.isArray(summary.metricTypes)).toBe(true);
    });

    it('aggregates known metrics by name with min max avg', () => {
      monitor.recordMetric({
        name: 'PERF_AGG_TEST',
        value: 100,
        timestamp: Date.now(),
      });
      monitor.recordMetric({
        name: 'PERF_AGG_TEST',
        value: 200,
        timestamp: Date.now(),
      });

      const summary = monitor.getSummary();
      const aggType = summary.metricTypes.find(
        (t: { name: string }) => t.name === 'PERF_AGG_TEST',
      );
      expect(aggType).toBeDefined();
      expect(aggType.count).toBe(2);
      expect(aggType.min).toBe(100);
      expect(aggType.max).toBe(200);
      expect(aggType.avg).toBe(150);
    });
  });
});

describe('getPerformanceMonitor singleton', () => {
  it('returns a valid monitor instance', () => {
    const m = getPerformanceMonitor();
    expect(m).toBeDefined();
    expect(typeof m.getMetrics).toBe('function');
    expect(typeof m.recordMetric).toBe('function');
    expect(typeof m.getSummary).toBe('function');
  });

  it('returns same instance on repeated calls', () => {
    const a = getPerformanceMonitor();
    const b = getPerformanceMonitor();
    expect(a).toBe(b);
  });
});
