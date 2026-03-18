/**
 * =========================================================
 * API Instrumentation Wrapper
 * =========================================================
 * Wraps API handlers with automatic monitoring, logging, and error handling
 */

import { NextResponse } from 'next/server';
import { enterpriseMonitor } from './enterprise-monitor';
import { logStructured, type LogDomain } from './structured-logger';

export interface MonitoringContext {
  domain: LogDomain;
  endpoint: string;
  orgId?: string;
  userId?: string;
}

export interface MonitoredResult<T> {
  data: T;
  duration: number;
  status: number;
}

function safeMonitorCall(label: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    console.error(`[monitoring] ${label} failed`, error);
  }
}

/**
 * Wrap an async operation with monitoring
 * Tracks duration, success/failure, and logs structured events
 */
export async function withMonitoring<T>(
  domain: LogDomain,
  endpoint: string,
  handler: () => Promise<T>,
  context?: { orgId?: string; userId?: string }
): Promise<T> {
  const start = Date.now();

  try {
    const result = await handler();
    const duration = Date.now() - start;

    // Track successful call
    safeMonitorCall('track_api_success', () => {
      enterpriseMonitor.trackAPICall(domain, endpoint, duration, 200);
    });

    // Log info for slow requests
    if (duration > 500) {
      safeMonitorCall('log_slow_request', () => {
        logStructured({
          timestamp: new Date().toISOString(),
          level: 'warn',
          domain,
          action: `slow_request:${endpoint}`,
          duration,
          orgId: context?.orgId,
          userId: context?.userId,
        });
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const err = error instanceof Error ? error : new Error(String(error));

    // Determine status code from error
    const status = getStatusFromError(err);

    // Track failed call
    safeMonitorCall('track_api_error', () => {
      enterpriseMonitor.trackAPICall(domain, endpoint, duration, status, {
        code: getErrorCode(err),
        message: err.message,
      });
    });

    // Log error
    safeMonitorCall('log_api_error', () => {
      logStructured({
        timestamp: new Date().toISOString(),
        level: status >= 500 ? 'error' : 'warn',
        domain,
        action: `error:${endpoint}`,
        duration,
        orgId: context?.orgId,
        userId: context?.userId,
        error: {
          code: getErrorCode(err),
          message: err.message,
          stack: err.stack,
        },
      });
    });

    throw error;
  }
}

/**
 * Wrap a Next.js API route handler with full instrumentation
 */
export function withAPIMonitoring<T>(
  domain: LogDomain,
  endpoint: string,
  handler: () => Promise<NextResponse<T>>,
  context?: { orgId?: string; userId?: string }
): Promise<NextResponse<T | { error: string }>> {
  return withMonitoring(domain, endpoint, handler, context).catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const status = getStatusFromError(err);

    return NextResponse.json(
      { error: err.message },
      { status }
    ) as NextResponse<{ error: string }>;
  });
}

/**
 * Create a monitored API handler wrapper for a specific domain
 */
export function createMonitoredHandler(domain: LogDomain) {
  return function monitoredHandler<T>(
    endpoint: string,
    handler: () => Promise<NextResponse<T>>,
    context?: { orgId?: string; userId?: string }
  ): Promise<NextResponse<T | { error: string }>> {
    return withAPIMonitoring(domain, endpoint, handler, context);
  };
}

/**
 * Track background job execution
 */
export async function withJobMonitoring<T>(
  jobName: string,
  handler: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await handler();
    const duration = Date.now() - start;

    safeMonitorCall('track_job_success', () => {
      enterpriseMonitor.trackBackgroundJob(jobName, true, duration);
    });

    safeMonitorCall('log_job_success', () => {
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'info',
        domain: 'automation',
        action: `job_completed:${jobName}`,
        duration,
      });
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const err = error instanceof Error ? error : new Error(String(error));

    safeMonitorCall('track_job_error', () => {
      enterpriseMonitor.trackBackgroundJob(jobName, false, duration, {
        code: getErrorCode(err),
        message: err.message,
      });
    });

    throw error;
  }
}

/**
 * Get HTTP status code from error
 */
function getStatusFromError(error: Error): number {
  // Check for known error types
  if ('status' in error && typeof (error as { status: number }).status === 'number') {
    return (error as { status: number }).status;
  }

  if ('statusCode' in error && typeof (error as { statusCode: number }).statusCode === 'number') {
    return (error as { statusCode: number }).statusCode;
  }

  // Infer from error message
  const message = error.message.toLowerCase();
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return 401;
  }
  if (message.includes('forbidden') || message.includes('not allowed') || message.includes('access denied')) {
    return 403;
  }
  if (message.includes('not found')) {
    return 404;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 400;
  }

  return 500;
}

/**
 * Get error code from error
 */
function getErrorCode(error: Error): string {
  if ('code' in error && typeof (error as { code: string }).code === 'string') {
    return (error as { code: string }).code;
  }

  return 'INTERNAL_ERROR';
}

// Pre-configured domain handlers
export const executiveAPI = createMonitoredHandler('executive');
export const careOpsAPI = createMonitoredHandler('care-ops');
export const healthAPI = createMonitoredHandler('health');
export const billingAPI = createMonitoredHandler('billing');
export const exportAPI = createMonitoredHandler('export');
