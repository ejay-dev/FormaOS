/**
 * Audit 2026-05-26 — console.* shim that routes through pino + PII
 * redaction. Use as a drop-in replacement when you'd otherwise reach
 * for console.error / console.warn / console.log inside server code.
 *
 * Why: the pino logger in `@/lib/monitoring/server-logger` redacts
 * `email`, `password`, `token`, `apiKey`, `secret`, etc. — both at
 * the top level and nested. Raw `console.*` calls bypass all of that.
 * lib/ had ~231 such call sites; this shim lets them be migrated
 * mechanically without each call site picking a route-scoped child
 * logger.
 *
 * Call signature matches the console (first-arg-is-message, rest are
 * splatted in). Internally we route through pino in a way that
 * preserves error objects' shape and triggers the redact list on
 * any `{ key: value }` style payload.
 *
 * Future direction: replace direct `consoleShim.*` calls with proper
 * route-scoped child loggers (`routeLog('/api/foo')`) — but the shim
 * is a safe migration step that immediately benefits from redaction.
 */
import 'server-only';
import { log } from './server-logger';

type LogMethod = (...args: unknown[]) => void;

const isTest = process.env.NODE_ENV === 'test';

function adapt(
  level: 'info' | 'warn' | 'error' | 'debug',
  consoleMethod: 'log' | 'warn' | 'error' | 'info' | 'debug',
): LogMethod {
  return (...args: unknown[]) => {
    // In test mode, also call the original console method so existing
    // jest.spyOn(console, '...') assertions keep working. Production
    // and dev go through pino only — that's the redaction path.
    if (isTest) {
       
      (console[consoleMethod] as (...a: unknown[]) => void)(...args);
    }

    if (args.length === 0) {
      (log[level] as (...a: unknown[]) => void)('');
      return;
    }

    // Single string → just the message.
    if (args.length === 1 && typeof args[0] === 'string') {
      (log[level] as (...a: unknown[]) => void)(args[0]);
      return;
    }

    // (message, ...rest). Pino wants the object first, message second.
    const [first, ...rest] = args;
    if (typeof first === 'string') {
      const ctx: Record<string, unknown> = {};
      for (let i = 0; i < rest.length; i++) {
        const value = rest[i];
        if (value instanceof Error) {
          ctx.err = value;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(ctx, value as Record<string, unknown>);
        } else {
          ctx[`arg${i}`] = value;
        }
      }
      (log[level] as (ctx: object, msg: string) => void)(ctx, first);
      return;
    }

    // First arg already an object — keep pino's preferred (ctx, msg)
    // ordering as best we can.
    const ctx = first;
    const msg = typeof rest[0] === 'string' ? (rest[0] as string) : '';
    (log[level] as (ctx: unknown, msg: string) => void)(ctx, msg);
  };
}

export const consoleShim = {
  log: adapt('info', 'log'),
  info: adapt('info', 'info'),
  warn: adapt('warn', 'warn'),
  error: adapt('error', 'error'),
  debug: adapt('debug', 'debug'),
};
