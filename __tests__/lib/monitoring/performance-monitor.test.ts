/**
 * @jest-environment jsdom
 */

/**
 * Tests for lib/monitoring/performance-monitor.ts
 * Covers: initPerformanceMonitoring, trackCustomMetric, trackComponentMount,
 *         trackAsyncOperation, trackCacheEvent, trackAPIRequest,
 *         getPerformanceBudgetStatus, getWebVitalRating, sendToAnalytics
 */

// Override the global mock from jest.setup.js
jest.unmock('@/lib/monitoring/performance-monitor');

jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
  onINP: jest.fn(),
}));

jest.mock('react', () => ({
  useRef: jest.fn((init: any) => ({ current: init })),
  useEffect: jest.fn((fn: () => void) => fn()),
}));

import {
  initPerformanceMonitoring,
  trackCustomMetric,
  trackComponentMount,
  trackAsyncOperation,
  trackCacheEvent,
  trackAPIRequest,
  getPerformanceBudgetStatus,
  CUSTOM_METRICS,
} from '@/lib/monitoring/performance-monitor';
import { onCLS, onLCP } from 'web-vitals';
import { healthLogger } from '@/lib/observability/structured-logger';

describe('monitoring/performance-monitor', () => {
  const _originalWindow = global.window;
  const _originalDocument = global.document;
  const originalProcess = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // @ts-ignore
    if (typeof global.window !== 'undefined') {
      delete (global.window as any).gtag;
      delete (global.window as any).va;
    }
    (process.env as any).NODE_ENV = originalProcess;
  });

  // ─── CUSTOM_METRICS ──────────────────────────────────────────
  describe('CUSTOM_METRICS', () => {
    it('has expected metric keys', () => {
      expect(CUSTOM_METRICS.CHECKLIST_LOAD).toBe('checklist_load_time');
      expect(CUSTOM_METRICS.ROADMAP_RENDER).toBe('roadmap_render_time');
      expect(CUSTOM_METRICS.CACHE_HIT).toBe('cache_hit');
      expect(CUSTOM_METRICS.CACHE_MISS).toBe('cache_miss');
      expect(CUSTOM_METRICS.API_REQUEST).toBe('api_request_time');
      expect(CUSTOM_METRICS.COMPONENT_MOUNT).toBe('component_mount_time');
      expect(CUSTOM_METRICS.ANALYTICS_EVENT).toBe('analytics_event_sent');
    });
  });

  // ─── initPerformanceMonitoring ───────────────────────────────
  describe('initPerformanceMonitoring', () => {
    it('registers web vitals callbacks when window exists', () => {
      initPerformanceMonitoring();
      expect(onCLS).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
    });
  });

  // ─── trackCustomMetric ───────────────────────────────────────
  describe('trackCustomMetric', () => {
    it('creates a custom metric and calls sendToAnalytics', () => {
      trackCustomMetric('test_metric', 42, { key: 'value' });
      // In node env with no window.gtag, it should still not throw
    });

    it('works without metadata', () => {
      trackCustomMetric('bare_metric', 100);
    });
  });

  // ─── trackComponentMount ─────────────────────────────────────
  describe('trackComponentMount', () => {
    it('tracks mount time based on startTime', () => {
      const start = 100;
      expect(() => trackComponentMount('MyComponent', start)).not.toThrow();
    });
  });

  // ─── trackAsyncOperation ─────────────────────────────────────
  describe('trackAsyncOperation', () => {
    it('tracks duration of successful operation', async () => {
      const result = await trackAsyncOperation(
        'test_op',
        async () => 'success',
        { extra: true },
      );
      expect(result).toBe('success');
    });

    it('tracks duration and rethrows on failure', async () => {
      await expect(
        trackAsyncOperation('failing_op', async () => {
          throw new Error('op failed');
        }),
      ).rejects.toThrow('op failed');
    });

    it('handles non-Error throws', async () => {
      await expect(
        trackAsyncOperation('string_throw', async () => {
          throw 'string error';
        }),
      ).rejects.toBe('string error');
    });

    it('passes metadata to the metric', async () => {
      await trackAsyncOperation('meta_op', async () => 42, { route: '/test' });
    });
  });

  // ─── trackCacheEvent ─────────────────────────────────────────
  describe('trackCacheEvent', () => {
    it('tracks cache hit', () => {
      expect(() => trackCacheEvent(true, 'my-cache')).not.toThrow();
    });

    it('tracks cache miss', () => {
      expect(() => trackCacheEvent(false, 'my-cache')).not.toThrow();
    });
  });

  // ─── trackAPIRequest ─────────────────────────────────────────
  describe('trackAPIRequest', () => {
    it('tracks successful API request', async () => {
      const result = await trackAPIRequest('/api/test', async () => ({
        ok: true,
      }));
      expect(result).toEqual({ ok: true });
    });

    it('tracks failed API request', async () => {
      await expect(
        trackAPIRequest('/api/fail', async () => {
          throw new Error('500');
        }),
      ).rejects.toThrow('500');
    });
  });

  // ─── getPerformanceBudgetStatus ──────────────────────────────
  describe('getPerformanceBudgetStatus', () => {
    const origGetEntries = performance.getEntriesByType;

    beforeEach(() => {
      // Ensure getEntriesByType exists (jsdom may not have it)
      if (!performance.getEntriesByType) {
        (performance as any).getEntriesByType = jest.fn(() => []);
      }
    });

    afterEach(() => {
      if (origGetEntries) {
        performance.getEntriesByType = origGetEntries;
      } else {
        delete (performance as any).getEntriesByType;
      }
    });

    it('returns results with TTFB critical status', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'navigation')
          return [{ responseStart: 2500, requestStart: 0 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const ttfb = result.find((r: any) => r.metric === 'TTFB');
      expect(ttfb).toBeDefined();
      expect(ttfb!.status).toBe('critical');
    });

    it('returns TTFB warning status', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'navigation')
          return [{ responseStart: 1000, requestStart: 0 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const ttfb = result.find((r: any) => r.metric === 'TTFB');
      // A missing entry is a regression, not a pass — assert it exists first.
      expect(ttfb).toBeDefined();
      expect(ttfb!.status).toBe('warning');
    });

    it('returns FCP critical when startTime > 3000', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'paint')
          return [{ name: 'first-contentful-paint', startTime: 3500 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const fcp = result.find((r: any) => r.metric === 'FCP');
      expect(fcp).toBeDefined();
      expect(fcp!.status).toBe('critical');
    });

    it('returns FCP warning when 2000 < startTime <= 3000', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'paint')
          return [{ name: 'first-contentful-paint', startTime: 2500 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const fcp = result.find((r: any) => r.metric === 'FCP');
      expect(fcp).toBeDefined();
      expect(fcp!.status).toBe('warning');
    });

    it('returns no FCP when startTime <= 2000', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'paint')
          return [{ name: 'first-contentful-paint', startTime: 1500 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const fcp = result.find((r: any) => r.metric === 'FCP');
      expect(fcp).toBeUndefined();
    });

    it('returns empty when no navigation or paint entries', () => {
      (performance as any).getEntriesByType = jest.fn(() => []);
      const result = getPerformanceBudgetStatus();
      expect(result).toEqual([]);
    });

    it('returns no TTFB issue when it is below good threshold', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'navigation')
          return [{ responseStart: 200, requestStart: 0 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      expect(result.find((r: any) => r.metric === 'TTFB')).toBeUndefined();
    });
  });

  // ─── sendToAnalytics internal branches ───────────────────────
  describe('sendToAnalytics branches (via trackCustomMetric)', () => {
    it('sends to gtag when available', () => {
      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackCustomMetric('test', 100.4, { x: 1 });

      expect(mockGtag).toHaveBeenCalledTimes(1);
      const [command, eventName, payload] = mockGtag.mock.calls[0];
      expect(command).toBe('event');
      expect(eventName).toBe('test');
      expect(payload).toMatchObject({
        // Custom metrics take the non-web-vital branch: rounded value,
        // 'Custom Metrics' category, metadata spread on top.
        event_category: 'Custom Metrics',
        value: 100,
        x: 1,
      });
      expect(typeof payload.timestamp).toBe('number');
    });

    it('does not call gtag when it is not installed', () => {
      // afterEach removes window.gtag; assert the guard actually guards.
      expect((window as any).gtag).toBeUndefined();
      expect(() => trackCustomMetric('test', 100)).not.toThrow();
    });

    it('sends to Vercel Analytics (va) when available', () => {
      const mockVa = jest.fn();
      (window as any).va = mockVa;

      trackCustomMetric('test', 200, { route: '/app' });

      expect(mockVa).toHaveBeenCalledWith('track', 'test', {
        value: 200,
        route: '/app',
      });
    });

    it('forwards to both gtag and va when both are installed', () => {
      const mockGtag = jest.fn();
      const mockVa = jest.fn();
      (window as any).gtag = mockGtag;
      (window as any).va = mockVa;

      trackCustomMetric('dual', 5);

      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockVa).toHaveBeenCalledTimes(1);
    });

    it('logs in development mode', () => {
      (process.env as any).NODE_ENV = 'development';
      trackCustomMetric('dev_metric', 50, { source: 'unit-test' });
      expect(healthLogger.info).toHaveBeenCalledWith(
        'performance_metric_observed',
        expect.objectContaining({
          name: 'dev_metric',
          value: 50,
          metadata: { source: 'unit-test' },
        }),
      );
    });

    it('does not log outside development', () => {
      (process.env as any).NODE_ENV = 'production';
      trackCustomMetric('prod_metric', 50);
      expect(healthLogger.info).not.toHaveBeenCalled();
    });
  });

  // ─── trackCustomMetric / trackAsyncOperation payloads ────────
  describe('metric payloads reach analytics', () => {
    it('trackAsyncOperation reports a success status and a duration', async () => {
      const mockVa = jest.fn();
      (window as any).va = mockVa;

      await trackAsyncOperation('meta_op', async () => 42, { route: '/test' });

      expect(mockVa).toHaveBeenCalledWith(
        'track',
        'meta_op',
        expect.objectContaining({ route: '/test', status: 'success' }),
      );
      expect(mockVa.mock.calls[0][2].value).toBeGreaterThanOrEqual(0);
    });

    it('trackComponentMount reports under the component_mount metric name', () => {
      const mockVa = jest.fn();
      (window as any).va = mockVa;

      trackComponentMount('MyComponent', performance.now());

      expect(mockVa).toHaveBeenCalledWith(
        'track',
        CUSTOM_METRICS.COMPONENT_MOUNT,
        expect.objectContaining({ component: 'MyComponent' }),
      );
    });

    it('trackCacheEvent distinguishes hit from miss', () => {
      const mockVa = jest.fn();
      (window as any).va = mockVa;

      trackCacheEvent(true, 'my-cache');
      trackCacheEvent(false, 'my-cache');

      expect(mockVa.mock.calls.map((call) => call[1])).toEqual([
        CUSTOM_METRICS.CACHE_HIT,
        CUSTOM_METRICS.CACHE_MISS,
      ]);
    });
  });
});
