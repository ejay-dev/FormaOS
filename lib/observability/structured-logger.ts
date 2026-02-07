/**
 * =========================================================
 * Structured Logging for Enterprise Observability
 * =========================================================
 * Provides consistent log format for Vercel log filtering
 * Pattern: [DOMAIN] [LEVEL] message
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export type LogDomain =
  | 'executive'
  | 'care-ops'
  | 'health'
  | 'automation'
  | 'export'
  | 'billing'
  | 'auth'
  | 'rbac'
  | 'api';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  domain: LogDomain;
  action: string;
  orgId?: string;
  userId?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface LogContext {
  orgId?: string;
  userId?: string;
  requestId?: string;
}

function safeStringify(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, (_key, val) =>
      typeof val === 'bigint' ? val.toString() : val
    );
  } catch {
    return '{"logging_error":"unserializable_context"}';
  }
}

/**
 * Log a structured event
 * Output format: [DOMAIN] [LEVEL] action - details
 */
export function logStructured(log: StructuredLog): void {
  const { timestamp, level, domain, action, orgId, userId, duration, error, metadata } = log;

  // Build log parts
  const parts: string[] = [
    `[${domain.toUpperCase()}]`,
    `[${level.toUpperCase()}]`,
    action,
  ];

  // Add context
  const context: Record<string, unknown> = {};
  if (orgId) context.orgId = orgId;
  if (userId) context.userId = userId;
  if (duration !== undefined) context.durationMs = duration;
  if (metadata) Object.assign(context, metadata);

  // Add error details
  if (error) {
    context.error = {
      code: error.code,
      message: error.message,
    };
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      context.stack = error.stack;
    }
  }

  const message = parts.join(' ');
  const contextStr = Object.keys(context).length > 0
    ? ` ${safeStringify(context)}`
    : '';

  const fullMessage = `${message}${contextStr}`;

  // Use appropriate console method based on level
  switch (level) {
    case 'critical':
    case 'error':
      console.error(fullMessage);
      break;
    case 'warn':
      console.warn(fullMessage);
      break;
    default:
      console.log(fullMessage);
  }
}

/**
 * Create a domain-scoped logger
 */
export function createDomainLogger(domain: LogDomain, context?: LogContext) {
  return {
    info: (action: string, metadata?: Record<string, unknown>) =>
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'info',
        domain,
        action,
        ...context,
        metadata,
      }),

    warn: (action: string, metadata?: Record<string, unknown>) =>
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'warn',
        domain,
        action,
        ...context,
        metadata,
      }),

    error: (action: string, error: Error | { code: string; message: string }, metadata?: Record<string, unknown>) =>
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'error',
        domain,
        action,
        ...context,
        error: {
          code: 'code' in error ? error.code : 'UNKNOWN',
          message: error.message,
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata,
      }),

    critical: (action: string, error: Error | { code: string; message: string }, metadata?: Record<string, unknown>) =>
      logStructured({
        timestamp: new Date().toISOString(),
        level: 'critical',
        domain,
        action,
        ...context,
        error: {
          code: 'code' in error ? error.code : 'CRITICAL',
          message: error.message,
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata,
      }),

    timed: async <T>(action: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> => {
      const start = Date.now();
      try {
        const result = await fn();
        logStructured({
          timestamp: new Date().toISOString(),
          level: 'info',
          domain,
          action,
          ...context,
          duration: Date.now() - start,
          metadata,
        });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logStructured({
          timestamp: new Date().toISOString(),
          level: 'error',
          domain,
          action,
          ...context,
          duration: Date.now() - start,
          error: {
            code: 'OPERATION_FAILED',
            message: error.message,
            stack: error.stack,
          },
          metadata,
        });
        throw err;
      }
    },
  };
}

// Pre-configured domain loggers
export const executiveLogger = createDomainLogger('executive');
export const careOpsLogger = createDomainLogger('care-ops');
export const healthLogger = createDomainLogger('health');
export const automationLogger = createDomainLogger('automation');
export const exportLogger = createDomainLogger('export');
export const billingLogger = createDomainLogger('billing');
export const authLogger = createDomainLogger('auth');
export const rbacLogger = createDomainLogger('rbac');
export const apiLogger = createDomainLogger('api');
