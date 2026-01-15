/**
 * Performance monitoring utilities for FormaOS
 * Tracks Core Web Vitals, API performance, and user interactions
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'CLS' | 'INP' | 'TTFB';
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initWebVitals();
    this.initAPIPerformanceTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track Core Web Vitals using the web-vitals library pattern
   */
  private initWebVitals() {
    if (typeof window === 'undefined') return;

    // Track First Contentful Paint
    this.observePerformanceEntry('first-contentful-paint', (entry) => {
      this.recordMetric({
        name: 'FCP',
        value: entry.startTime,
        timestamp: Date.now(),
        url: window.location.href,
        sessionId: this.sessionId,
      });
    });

    // Track Largest Contentful Paint
    this.observeLCP();

    // Track Cumulative Layout Shift
    this.observeCLS();

    // Track Interaction to Next Paint (if supported)
    this.observeINP();

    // Track Time to First Byte
    this.observeTTFB();
  }

  private observePerformanceEntry(
    entryType: string,
    callback: (entry: PerformanceEntry) => void,
  ) {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ entryTypes: [entryType] });
      } catch (error) {
        console.warn(`Failed to observe ${entryType}:`, error);
      }
    }
  }

  private observeLCP() {
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.recordMetric({
        name: 'LCP',
        value: entry.startTime,
        timestamp: Date.now(),
        url: window.location.href,
        sessionId: this.sessionId,
      });
    });
  }

  private observeCLS() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as LayoutShift[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }

          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            url: window.location.href,
            sessionId: this.sessionId,
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Failed to observe CLS:', error);
      }
    }
  }

  private observeINP() {
    // Simplified INP tracking (interaction timing)
    if (typeof window !== 'undefined') {
      let interactionStart = 0;

      ['click', 'keydown', 'touchstart'].forEach((eventType) => {
        window.addEventListener(eventType, () => {
          interactionStart = performance.now();
        });
      });

      // Track when interaction completes
      ['click', 'keyup', 'touchend'].forEach((eventType) => {
        window.addEventListener(eventType, () => {
          if (interactionStart > 0) {
            const interactionTime = performance.now() - interactionStart;
            this.recordMetric({
              name: 'INP',
              value: interactionTime,
              timestamp: Date.now(),
              url: window.location.href,
              sessionId: this.sessionId,
            });
            interactionStart = 0;
          }
        });
      });
    }
  }

  private observeTTFB() {
    if (typeof window !== 'undefined' && 'navigation' in performance) {
      const navTiming = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        this.recordMetric({
          name: 'TTFB',
          value: ttfb,
          timestamp: Date.now(),
          url: window.location.href,
          sessionId: this.sessionId,
        });
      }
    }
  }

  /**
   * Track API performance for all fetch requests
   */
  private initAPIPerformanceTracking() {
    if (typeof window === 'undefined') return;

    // Intercept fetch requests to track API performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0]?.toString() || 'unknown';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        // Only track API calls (not external resources)
        if (url.startsWith('/api/') || url.includes('/api/')) {
          this.recordMetric({
            name: 'API_RESPONSE_TIME',
            value: endTime - startTime,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            metadata: {
              url,
              status: response.status,
              method: args[1]?.method || 'GET',
              success: response.ok,
            },
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.recordMetric({
          name: 'API_ERROR',
          value: endTime - startTime,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          metadata: {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: args[1]?.method || 'GET',
          },
        });

        throw error;
      }
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Send to analytics if configured
    this.sendToAnalytics(metric);

    // Log performance issues
    if (this.isPerformanceIssue(metric)) {
      console.warn('Performance issue detected:', metric);
    }
  }

  /**
   * Track custom timing
   */
  timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return operation().then(
      (result) => {
        this.recordMetric({
          name: `CUSTOM_${name.toUpperCase()}`,
          value: performance.now() - startTime,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          metadata: { success: true },
        });
        return result;
      },
      (error) => {
        this.recordMetric({
          name: `CUSTOM_${name.toUpperCase()}_ERROR`,
          value: performance.now() - startTime,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          metadata: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        throw error;
      },
    );
  }

  /**
   * Check if metric indicates performance issue
   */
  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      FCP: 1800, // First Contentful Paint > 1.8s
      LCP: 2500, // Largest Contentful Paint > 2.5s
      CLS: 0.1, // Cumulative Layout Shift > 0.1
      INP: 200, // Interaction to Next Paint > 200ms
      TTFB: 600, // Time to First Byte > 600ms
      API_RESPONSE_TIME: 3000, // API response > 3s
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    return threshold !== undefined && metric.value > threshold;
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // Only send in production and if analytics is enabled
    if (process.env.NODE_ENV !== 'production') return;

    // Send to PostHog or other analytics service
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        session_id: metric.sessionId,
        url: metric.url,
        metadata: metric.metadata,
      });
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary for debugging
   */
  getSummary() {
    const metricsByName = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.value);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const summary = Object.entries(metricsByName).map(([name, values]) => ({
      name,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      latest: values[values.length - 1],
    }));

    return {
      sessionId: this.sessionId,
      totalMetrics: this.metrics.length,
      metricTypes: summary,
    };
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get or create the global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return getPerformanceMonitor();
}

// Types for external use
export type { PerformanceMetric, WebVitalsMetric };

// Layout Shift interface (not available in all TypeScript versions)
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
