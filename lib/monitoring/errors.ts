/**
 * Error tracking and reporting utilities for FormaOS
 * Integrates with Sentry and provides custom error boundaries
 */

'use client';

import React, { ErrorInfo } from 'react';

interface ErrorReport {
  error: Error;
  errorInfo?: ErrorInfo;
  context?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  breadcrumbs?: Breadcrumb[];
}

interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private maxBreadcrumbs = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `error_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize global error handlers
   */
  private initGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error',
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      this.captureError(error, {
        context: {
          type: 'unhandled_promise_rejection',
          reason: event.reason,
        },
      });
    });

    // Handle React errors (if React is available)
    if (typeof window !== 'undefined' && (window as any).React) {
      this.initReactErrorBoundary();
    }
  }

  /**
   * Initialize React error boundary
   */
  private initReactErrorBoundary() {
    // This would be used in conjunction with a React Error Boundary component
    // The actual component would call this.captureReactError()
  }

  /**
   * Capture a React component error
   */
  captureReactError(
    error: Error,
    errorInfo: ErrorInfo,
    additionalContext?: Record<string, any>,
  ) {
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'react',
      message: 'React component error',
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });

    this.captureError(error, {
      errorInfo,
      context: {
        type: 'react_error',
        componentStack: errorInfo.componentStack,
        ...additionalContext,
      },
    });
  }

  /**
   * Capture an API error
   */
  captureAPIError(
    error: Error,
    url: string,
    method: string,
    status?: number,
    response?: any,
  ) {
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'http',
      message: `API ${method} ${url} failed`,
      level: 'error',
      data: {
        url,
        method,
        status,
        response:
          typeof response === 'string' ? response : JSON.stringify(response),
      },
    });

    this.captureError(error, {
      context: {
        type: 'api_error',
        url,
        method,
        status,
        response,
      },
    });
  }

  /**
   * Capture a custom error
   */
  captureError(
    error: Error,
    options: {
      errorInfo?: ErrorInfo;
      context?: Record<string, any>;
      tags?: Record<string, string>;
      level?: 'info' | 'warning' | 'error' | 'fatal';
      userId?: string;
    } = {},
  ) {
    const errorReport: ErrorReport = {
      error,
      errorInfo: options.errorInfo,
      context: options.context,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: options.userId,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      breadcrumbs: [...this.breadcrumbs],
    };

    // Send to Sentry if available
    this.sendToSentry(errorReport, options);

    // Send to custom analytics
    this.sendToAnalytics(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    // Add to breadcrumbs for future context
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'error',
      message: error.message,
      level: (() => {
        const level = options.level;
        if (level === 'info' || level === 'warning' || level === 'error') {
          return level;
        }
        return 'error';
      })(),
      data: {
        stack: error.stack,
        name: error.name,
      },
    });
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Breadcrumb) {
    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs to prevent memory issues
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Capture a user action breadcrumb
   */
  captureUserAction(action: string, data?: Record<string, any>) {
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'user',
      message: `User ${action}`,
      level: 'info',
      data,
    });
  }

  /**
   * Capture a navigation breadcrumb
   */
  captureNavigation(from: string, to: string) {
    this.addBreadcrumb({
      timestamp: Date.now(),
      category: 'navigation',
      message: `Navigated from ${from} to ${to}`,
      level: 'info',
      data: { from, to },
    });
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(errorReport: ErrorReport, options: any) {
    if (typeof window === 'undefined') return;

    // Check if Sentry is available
    const Sentry = (window as any).Sentry;
    if (!Sentry) return;

    try {
      // Set user context
      if (errorReport.userId) {
        Sentry.setUser({ id: errorReport.userId });
      }

      // Set session context
      Sentry.setTag('sessionId', errorReport.sessionId);

      // Set additional tags
      if (options.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          Sentry.setTag(key, value);
        });
      }

      // Add breadcrumbs
      errorReport.breadcrumbs?.forEach((breadcrumb) => {
        Sentry.addBreadcrumb({
          timestamp: breadcrumb.timestamp / 1000, // Sentry expects seconds
          category: breadcrumb.category,
          message: breadcrumb.message,
          level: breadcrumb.level as any,
          data: breadcrumb.data,
        });
      });

      // Set context
      if (errorReport.context) {
        Sentry.setContext('error_context', errorReport.context);
      }

      if (errorReport.errorInfo) {
        Sentry.setContext('react_error_info', {
          componentStack: errorReport.errorInfo.componentStack,
        });
      }

      // Capture the error
      Sentry.captureException(errorReport.error, {
        level: options.level || 'error',
      });
    } catch (sentryError) {
      console.warn('Failed to send error to Sentry:', sentryError);
    }
  }

  /**
   * Send error to analytics
   */
  private sendToAnalytics(errorReport: ErrorReport) {
    if (typeof window === 'undefined') return;

    // Send to PostHog if available
    const posthog = (window as any).posthog;
    if (posthog) {
      try {
        posthog.capture('error_occurred', {
          error_name: errorReport.error.name,
          error_message: errorReport.error.message,
          error_stack: errorReport.error.stack,
          session_id: errorReport.sessionId,
          user_id: errorReport.userId,
          url: errorReport.url,
          context: errorReport.context,
          breadcrumbs_count: errorReport.breadcrumbs?.length || 0,
        });
      } catch (analyticsError) {
        console.warn('Failed to send error to analytics:', analyticsError);
      }
    }
  }

  /**
   * Get current session information
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      breadcrumbsCount: this.breadcrumbs.length,
      lastBreadcrumb: this.breadcrumbs[this.breadcrumbs.length - 1],
    };
  }

  /**
   * Clear breadcrumbs (useful for testing)
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
}

// Global error tracker instance
let errorTracker: ErrorTracker | null = null;

/**
 * Get or create the global error tracker
 */
export function getErrorTracker(): ErrorTracker {
  if (!errorTracker) {
    errorTracker = new ErrorTracker();
  }
  return errorTracker;
}

/**
 * React hook for error tracking
 */
export function useErrorTracker() {
  return getErrorTracker();
}

/**
 * Higher-order component for error tracking
 */
export function withErrorTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
) {
  return function ErrorTrackingWrapper(props: P): React.ReactElement {
    const errorTracker = useErrorTracker();

    try {
      return React.createElement(Component, props);
    } catch (error) {
      if (error instanceof Error) {
        errorTracker.captureError(error, {
          context: {
            component: componentName || Component.name || 'Unknown',
            props: JSON.stringify(props),
          },
        });
      }
      throw error;
    }
  };
}

// Types for external use
export type { ErrorReport, Breadcrumb };
export { ErrorTracker };
