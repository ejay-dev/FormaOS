/**
 * =========================================================
 * FORMAOS — STRUCTURED SERVER LOGGER (Node.js only)
 * =========================================================
 * Pino-based structured logger for API routes and server actions.
 * Outputs JSON to stdout — Vercel and most log drains consume this
 * natively. Do NOT import in client components or middleware.
 *
 * Usage:
 *   import { log, routeLog } from '@/lib/monitoring/server-logger';
 *
 *   // Module-level child logger (preferred)
 *   const log = routeLog('/api/v1/tasks');
 *   log.info({ userId, orgId }, 'Fetched tasks');
 *   log.error({ err }, 'Database query failed');
 *
 *   // Top-level logger
 *   log.warn({ rateLimitHit: true }, 'Rate limit exceeded');
 * =========================================================
 */
import 'server-only';
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const log = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  base: {
    service: 'formaos-api',
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
  },
  // Redact sensitive fields everywhere in the log tree
  redact: {
    paths: [
      'email',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'serviceRoleKey',
      '*.email',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger pre-scoped to a specific API route.
 * Call once at the top of the route file, then use throughout.
 *
 * @example
 *   const log = routeLog('/api/v1/tasks');
 */
export function routeLog(route: string) {
  return log.child({ route });
}
