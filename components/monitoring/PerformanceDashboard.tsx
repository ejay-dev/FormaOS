/**
 * Performance Dashboard
 * Real-time display of performance metrics and Web Vitals
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getPerformanceBudgetStatus } from '@/lib/monitoring/performance-monitor';

interface PerformanceData {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
  cacheHitRate?: number;
  avgApiTime?: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceData>({});
  const [budgetStatus, setBudgetStatus] = useState<
    ReturnType<typeof getPerformanceBudgetStatus>
  >([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Collect performance data periodically
    const interval = setInterval(() => {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        setMetrics({
          ttfb: navigation.responseStart - navigation.requestStart,
          // Other metrics filled by web-vitals callbacks
        });
      }

      setBudgetStatus(getPerformanceBudgetStatus());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        title="Performance Monitor"
      >
        📊 Perf
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-slate-700 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Web Vitals */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-semibold text-purple-400">
              Web Vitals
            </h4>

            {metrics.lcp && (
              <MetricRow
                label="LCP"
                value={metrics.lcp}
                unit="ms"
                threshold={{ good: 2500, poor: 4000 }}
              />
            )}

            {metrics.fid && (
              <MetricRow
                label="FID"
                value={metrics.fid}
                unit="ms"
                threshold={{ good: 100, poor: 300 }}
              />
            )}

            {metrics.cls && (
              <MetricRow
                label="CLS"
                value={metrics.cls}
                unit=""
                threshold={{ good: 0.1, poor: 0.25 }}
              />
            )}

            {metrics.ttfb && (
              <MetricRow
                label="TTFB"
                value={metrics.ttfb}
                unit="ms"
                threshold={{ good: 800, poor: 1800 }}
              />
            )}

            {metrics.inp && (
              <MetricRow
                label="INP"
                value={metrics.inp}
                unit="ms"
                threshold={{ good: 200, poor: 500 }}
              />
            )}
          </div>

          {/* Custom Metrics */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-semibold text-cyan-400">
              Custom Metrics
            </h4>

            {metrics.cacheHitRate !== undefined && (
              <MetricRow
                label="Cache Hit Rate"
                value={metrics.cacheHitRate}
                unit="%"
                threshold={{ good: 80, poor: 50 }}
              />
            )}

            {metrics.avgApiTime && (
              <MetricRow
                label="Avg API Time"
                value={metrics.avgApiTime}
                unit="ms"
                threshold={{ good: 500, poor: 2000 }}
              />
            )}
          </div>

          {/* Budget Status */}
          {budgetStatus.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-400">
                Warnings
              </h4>
              {budgetStatus.map((item, index) => (
                <div
                  key={index}
                  className={`text-xs p-2 rounded ${
                    item.status === 'critical'
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-orange-900/30 text-orange-300'
                  }`}
                >
                  <span className="font-semibold">{item.metric}:</span>{' '}
                  {item.message}
                </div>
              ))}
            </div>
          )}

          {/* No Data */}
          {Object.keys(metrics).length === 0 && (
            <p className="text-slate-400 text-sm text-center">
              Collecting metrics...
            </p>
          )}
        </div>
      )}
    </>
  );
}

interface MetricRowProps {
  label: string;
  value: number;
  unit: string;
  threshold: { good: number; poor: number };
}

function MetricRow({ label, value, unit, threshold }: MetricRowProps) {
  const getColor = () => {
    if (value <= threshold.good) return 'text-green-400';
    if (value <= threshold.poor) return 'text-orange-400';
    return 'text-red-400';
  };

  const displayValue = unit === 'ms' ? Math.round(value) : value.toFixed(2);

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={`font-mono font-semibold ${getColor()}`}>
        {displayValue}
        {unit}
      </span>
    </div>
  );
}
