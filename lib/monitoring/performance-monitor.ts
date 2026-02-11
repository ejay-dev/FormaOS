/**
 * Performance Monitoring - Real User Monitoring (RUM)
 * Tracks Web Vitals and custom performance metrics
 */

'use client';

import { onCLS, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

// Custom metrics interface
export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Performance thresholds (based on Web Vitals recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
};

// Custom metric names
export const CUSTOM_METRICS = {
  CHECKLIST_LOAD: 'checklist_load_time',
  ROADMAP_RENDER: 'roadmap_render_time',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  API_REQUEST: 'api_request_time',
  COMPONENT_MOUNT: 'component_mount_time',
  ANALYTICS_EVENT: 'analytics_event_sent',
} as const;

// Rating helper
function getWebVitalRating(
  metric: Metric,
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!thresholds) return 'good';

  if (metric.value <= thresholds.good) return 'good';
  if (metric.value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Send metric to analytics
function sendToAnalytics(metric: Metric | CustomMetric) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    const isWebVital = 'rating' in metric;

    if (isWebVital) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value,
        ),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: getWebVitalRating(metric),
      });
    } else {
      window.gtag('event', metric.name, {
        event_category: 'Custom Metrics',
        value: Math.round(metric.value),
        timestamp: metric.timestamp,
        ...metric.metadata,
      });
    }
  }

  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', metric.name, {
      value: metric.value,
      ...('metadata' in metric ? metric.metadata : {}),
    });
  }

  // Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Metric:', metric);
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once in your root layout or app component
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);

  // Track page visibility changes (for session duration)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      trackCustomMetric('session_duration', performance.now(), {
        exit_type: 'visibility_change',
      });
    }
  });

  // Track beforeunload (for session end)
  window.addEventListener('beforeunload', () => {
    trackCustomMetric('session_duration', performance.now(), {
      exit_type: 'page_unload',
    });
  });

  console.log('✅ Performance monitoring initialized');
}

/**
 * Track custom performance metric
 */
export function trackCustomMetric(
  name: string,
  value: number,
  metadata?: Record<string, any>,
) {
  const metric: CustomMetric = {
    name,
    value,
    timestamp: Date.now(),
    metadata,
  };

  sendToAnalytics(metric);
}

/**
 * Measure and track component mount time
 */
export function trackComponentMount(componentName: string, startTime: number) {
  const mountTime = performance.now() - startTime;
  trackCustomMetric(CUSTOM_METRICS.COMPONENT_MOUNT, mountTime, {
    component: componentName,
  });
}

/**
 * Measure and track async operation
 */
export async function trackAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    trackCustomMetric(operationName, duration, {
      ...metadata,
      status: 'success',
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    trackCustomMetric(operationName, duration, {
      ...metadata,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Track cache hit/miss rate
 */
export function trackCacheEvent(hit: boolean, cacheName: string) {
  trackCustomMetric(
    hit ? CUSTOM_METRICS.CACHE_HIT : CUSTOM_METRICS.CACHE_MISS,
    1,
    {
      cache_name: cacheName,
    },
  );
}

/**
 * Track API request performance
 */
export async function trackAPIRequest<T>(
  endpoint: string,
  request: () => Promise<T>,
): Promise<T> {
  return trackAsyncOperation(CUSTOM_METRICS.API_REQUEST, request, {
    endpoint,
  });
}

/**
 * Get performance budget status
 * Returns warnings if metrics exceed thresholds
 */
export function getPerformanceBudgetStatus(): Array<{
  metric: string;
  status: 'good' | 'warning' | 'critical';
  message: string;
}> {
  if (typeof window === 'undefined') return [];

  const navigation = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  const results: Array<{
    metric: string;
    status: 'good' | 'warning' | 'critical';
    message: string;
  }> = [];

  // Time to First Byte
  if (navigation) {
    const ttfb = navigation.responseStart - navigation.requestStart;
    if (ttfb > THRESHOLDS.TTFB.needsImprovement) {
      results.push({
        metric: 'TTFB',
        status: 'critical' as const,
        message: `TTFB is ${Math.round(ttfb)}ms (should be <${THRESHOLDS.TTFB.needsImprovement}ms)`,
      });
    } else if (ttfb > THRESHOLDS.TTFB.good) {
      results.push({
        metric: 'TTFB',
        status: 'warning' as const,
        message: `TTFB is ${Math.round(ttfb)}ms (optimal <${THRESHOLDS.TTFB.good}ms)`,
      });
    }
  }

  // First Contentful Paint
  const fcp = paint.find((p) => p.name === 'first-contentful-paint');
  if (fcp && fcp.startTime > 2000) {
    const fcpStatus: 'critical' | 'warning' = fcp.startTime > 3000 ? 'critical' : 'warning';
    results.push({
      metric: 'FCP',
      status: fcpStatus,
      message: `FCP is ${Math.round(fcp.startTime)}ms (should be <2000ms)`,
    });
  }

  return results;
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const isBrowser = typeof window !== 'undefined';
  const mountTimeRef = React.useRef<number | null>(null);
  if (isBrowser && mountTimeRef.current === null) {
    mountTimeRef.current = performance.now();
  }

  // Track mount on component load
  React.useEffect(() => {
    if (!isBrowser || mountTimeRef.current === null) {
      return;
    }
    trackComponentMount(componentName, mountTimeRef.current);
  }, [componentName, isBrowser]);

  return {
    trackMetric: (
      name: string,
      value: number,
      metadata?: Record<string, any>,
    ) => {
      if (!isBrowser) return;
      trackCustomMetric(name, value, { ...metadata, component: componentName });
    },
    trackOperation: <T>(operationName: string, operation: () => Promise<T>) => {
      if (!isBrowser) {
        return operation();
      }
      return trackAsyncOperation(operationName, operation, {
        component: componentName,
      });
    },
  };
}

// TypeScript declaration for global gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params: Record<string, any>,
    ) => void;
    va?: (
      command: string,
      eventName: string,
      params: Record<string, any>,
    ) => void;
  }
}

// React import
import React from 'react';
