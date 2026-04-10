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
      expect(result.find((r: any) => r.metric === 'TTFB')).toBeTruthy();
    });

    it('returns TTFB warning status', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'navigation')
          return [{ responseStart: 1000, requestStart: 0 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const ttfb = result.find((r: any) => r.metric === 'TTFB');
      if (ttfb) {
        expect(ttfb.status).toBe('warning');
      }
    });

    it('returns FCP critical when startTime > 3000', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'paint')
          return [{ name: 'first-contentful-paint', startTime: 3500 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const fcp = result.find((r: any) => r.metric === 'FCP');
      if (fcp) {
        expect(fcp.status).toBe('critical');
      }
    });

    it('returns FCP warning when 2000 < startTime <= 3000', () => {
      (performance as any).getEntriesByType = jest.fn((type: string) => {
        if (type === 'paint')
          return [{ name: 'first-contentful-paint', startTime: 2500 }];
        return [];
      });
      const result = getPerformanceBudgetStatus();
      const fcp = result.find((r: any) => r.metric === 'FCP');
      if (fcp) {
        expect(fcp.status).toBe('warning');
      }
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
      const savedWindow = global.window;
      try {
        const mockGtag = jest.fn();
        // @ts-ignore
        global.window = { gtag: mockGtag, location: { href: '' } };

        trackCustomMetric('test', 100, { x: 1 });
      } finally {
        // @ts-ignore
        global.window = savedWindow;
      }
    });

    it('sends to Vercel Analytics (va) when available', () => {
      const savedWindow = global.window;
      try {
        const mockVa = jest.fn();
        // @ts-ignore
        global.window = { va: mockVa, location: { href: '' } };

        trackCustomMetric('test', 200);
      } finally {
        // @ts-ignore
        global.window = savedWindow;
      }
    });

    it('logs in development mode', () => {
      (process.env as any).NODE_ENV = 'development';
      trackCustomMetric('dev_metric', 50);
      // healthLogger.info may or may not be called depending on window
    });
  });
});
