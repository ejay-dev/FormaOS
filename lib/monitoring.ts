/**
 * =========================================================
 * Monitoring & Observability Setup
 * =========================================================
 * Real-time monitoring for RBAC system, API health, and performance
 */

export interface MonitoringMetrics {
  rbacChecks: {
    total: number;
    failures: number;
    avgDuration: number;
  };
  apiHealth: {
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
  };
  dashboard: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export class RBACMonitor {
  private metrics = {
    rbacChecks: { total: 0, failures: 0, totalDuration: 0 },
    permissionDenials: 0,
    roleChangeEvents: 0,
  };

  /**
   * Track RBAC permission checks
   */
  trackPermissionCheck(role: string, permission: string, allowed: boolean, duration: number) {
    this.metrics.rbacChecks.total++;
    this.metrics.rbacChecks.totalDuration += duration;

    if (!allowed) {
      this.metrics.permissionDenials++;
    }

    // Log to external service (Sentry, DataDog, etc.)
    this.logEvent({
      event: 'rbac_permission_check',
      role,
      permission,
      allowed,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track role changes (important for audit trail)
   */
  trackRoleChange(userId: string, oldRole: string, newRole: string, changedBy: string) {
    this.metrics.roleChangeEvents++;

    this.logEvent({
      event: 'rbac_role_changed',
      userId,
      oldRole,
      newRole,
      changedBy,
      timestamp: new Date().toISOString(),
      severity: 'high', // Always log role changes
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      rbacChecks: {
        total: this.metrics.rbacChecks.total,
        failures: this.metrics.permissionDenials,
        avgDuration: this.metrics.rbacChecks.total > 0 
          ? this.metrics.rbacChecks.totalDuration / this.metrics.rbacChecks.total 
          : 0,
      },
      roleChangeEvents: this.metrics.roleChangeEvents,
      permissionDenials: this.metrics.permissionDenials,
    };
  }

  private logEvent(event: Record<string, unknown>) {
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry/DataDog/CloudWatch
      console.log('[MONITORING]', JSON.stringify(event));
    }
  }
}

interface EndpointMetrics {
  path: string;
  method: string;
  calls: number;
  errors: number;
  totalTime: number;
  lastError?: string;
}

export class APIHealthMonitor {
  private metrics = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
    endpointMetrics: new Map<string, EndpointMetrics>(),
  };

  /**
   * Track API request
   */
  trackRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    error?: string,
  ) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;

    if (statusCode >= 400) {
      this.metrics.errors++;
    }

    const key = `${method} ${path}`;
    const endpoint = this.metrics.endpointMetrics.get(key) || {
      path,
      method,
      calls: 0,
      errors: 0,
      totalTime: 0,
    };

    endpoint.calls++;
    endpoint.totalTime += duration;
    if (statusCode >= 400) endpoint.errors++;
    if (error) endpoint.lastError = error;

    this.metrics.endpointMetrics.set(key, endpoint);

    // Alert on high error rates
    if (endpoint.errors / endpoint.calls > 0.1) {
      this.alert(`High error rate on ${key}: ${((endpoint.errors / endpoint.calls) * 100).toFixed(1)}%`);
    }
  }

  /**
   * Get health status
   */
  getHealth() {
    const errorRate = this.metrics.requests > 0 
      ? (this.metrics.errors / this.metrics.requests) * 100 
      : 0;
    const avgResponseTime = this.metrics.requests > 0 
      ? this.metrics.totalResponseTime / this.metrics.requests 
      : 0;

    return {
      uptime: 100 - errorRate,
      errorRate: errorRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      endpoints: Array.from(this.metrics.endpointMetrics.values()).map((e) => ({
        ...e,
        errorRate: e.calls > 0 ? ((e.errors / e.calls) * 100).toFixed(1) : '0',
        avgTime: e.calls > 0 ? (e.totalTime / e.calls).toFixed(2) : '0',
      })),
    };
  }

  private alert(message: string) {
    console.warn('[ALERT]', message);
    // Send to Slack/PagerDuty in production
  }
}

interface PageLoadMetrics {
  timestamp: number;
  renderTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private metrics = {
    pageLoads: new Map<string, PageLoadMetrics[]>(),
  };

  /**
   * Track page load performance
   */
  trackPageLoad(
    page: string,
    renderTime: number,
    fcp: number,
    lcp: number,
    memoryUsage: number,
  ) {
    const metrics = this.metrics.pageLoads.get(page) || [];
    metrics.push({
      timestamp: Date.now(),
      renderTime,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      memoryUsage,
    });

    // Keep only last 100 entries per page
    if (metrics.length > 100) metrics.shift();

    this.metrics.pageLoads.set(page, metrics);

    // Alert on slow pages
    if (renderTime > 3000) {
      this.alert(`Slow page load: ${page} took ${renderTime}ms`);
    }
  }

  /**
   * Get performance metrics for a page
   */
  getPageMetrics(page: string) {
    const metrics = this.metrics.pageLoads.get(page) || [];
    if (metrics.length === 0) return null;

    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgFCP = metrics.reduce((sum, m) => sum + m.firstContentfulPaint, 0) / metrics.length;
    const avgLCP = metrics.reduce((sum, m) => sum + m.largestContentfulPaint, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;

    return {
      page,
      sampleSize: metrics.length,
      avgRenderTime: avgRenderTime.toFixed(2),
      avgFCP: avgFCP.toFixed(2),
      avgLCP: avgLCP.toFixed(2),
      avgMemory: avgMemory.toFixed(2),
      maxRenderTime: Math.max(...metrics.map((m) => m.renderTime)),
      minRenderTime: Math.min(...metrics.map((m) => m.renderTime)),
    };
  }

  private alert(message: string) {
    console.warn('[ALERT]', message);
  }
}

// Export singleton instances
export const rbacMonitor = new RBACMonitor();
export const apiHealthMonitor = new APIHealthMonitor();
export const performanceMonitor = new PerformanceMonitor();
