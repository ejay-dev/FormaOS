'use client';

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/monitoring';

/**
 * Hook to monitor page load performance
 * Usage: usePageLoadMonitoring('dashboard')
 */
export function usePageLoadMonitoring(pageName: string) {
  const startTimeRef = useRef(Date.now());
  const renderStartRef = useRef(Date.now());

  useEffect(() => {
    // Measure First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      // FCP measurement
      const fcpObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        const fcp = entry.startTime;

        // LCP measurement
        const lcpObserver = new PerformanceObserver((lcpList) => {
          const lcpEntry = lcpList.getEntries().at(-1) as PerformanceEntry;
          if (lcpEntry) {
            const lcp =
              (lcpEntry as any).renderTime ||
              (lcpEntry as any).loadTime ||
              lcpEntry.startTime;
            const renderTime = Date.now() - renderStartRef.current;
            const memoryUsage =
              (performance as any).memory?.usedJSHeapSize || 0;

            performanceMonitor.trackPageLoad(
              pageName,
              renderTime,
              fcp,
              lcp,
              memoryUsage / 1024 / 1024, // Convert to MB
            );

            lcpObserver.disconnect();
          }
        });

        lcpObserver.observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
      });

      fcpObserver.observe({ type: 'first-contentful-paint', buffered: true });

      return () => fcpObserver.disconnect();
    }
  }, [pageName]);
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string) {
  const renderStartRef = useRef(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    console.log(`[RENDER] ${componentName}: ${renderTime}ms`);
  }, [componentName]);
}
