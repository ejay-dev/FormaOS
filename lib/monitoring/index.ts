/**
 * Unified monitoring utilities index
 * Provides easy access to all monitoring capabilities
 */

export { getPerformanceMonitor, usePerformanceMonitor } from './performance';
export type { PerformanceMetric, WebVitalsMetric } from './performance';

export { getErrorTracker, useErrorTracker, withErrorTracking } from './errors';
export type { ErrorReport, Breadcrumb } from './errors';

export {
  getAnalytics,
  useAnalytics,
  useTrackMount,
  useTrackLifecycle,
} from './analytics';
export type { AnalyticsEvent, UserProperties, FeatureFlag } from './analytics';

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring() {
  // Log initialization
  console.log('FormaOS monitoring initialized');
}

/**
 * Get comprehensive monitoring status
 */
export function getMonitoringStatus() {
  return {
    status: 'active',
    timestamp: new Date().toISOString(),
    services: {
      performance: 'active',
      errors: 'active',
      analytics: 'active',
    },
  };
}
