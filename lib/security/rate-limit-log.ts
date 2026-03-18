import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logSecurityEvent, SecurityEventTypes } from '@/lib/security/session-security';

type RateLimitLogInput = {
  identifier: string;
  endpoint: string;
  requestCount: number;
  windowStart: number;
  blocked: boolean;
  userId?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const DB_WRITE_TIMEOUT_MS = 200;
const IS_BUILD_PHASE = process.env.NEXT_PHASE === 'phase-production-build';

async function withDbTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  operationName: string,
): Promise<void> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`[RateLimit] ${operationName} exceeded ${DB_WRITE_TIMEOUT_MS}ms; skipping write`);
      resolve(null);
    }, DB_WRITE_TIMEOUT_MS);
  });

  try {
    await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function logRateLimitEvent(input: RateLimitLogInput): void {
  if (IS_BUILD_PHASE) {
    return;
  }

  try {
    const admin = createSupabaseAdminClient();

    void withDbTimeout(
      admin.from('rate_limit_log').insert({
        identifier: input.identifier,
        endpoint: input.endpoint,
        request_count: input.requestCount,
        window_start: new Date(input.windowStart).toISOString(),
        blocked_at: input.blocked ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }),
      'rate_limit_log.insert',
    );

    if (input.blocked) {
      logSecurityEvent({
        eventType: SecurityEventTypes.RATE_LIMIT_EXCEEDED,
        userId: input.userId ?? undefined,
        organizationId: input.organizationId ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadata: {
          identifier: input.identifier,
          endpoint: input.endpoint,
          requestCount: input.requestCount,
          windowStart: new Date(input.windowStart).toISOString(),
        },
      });
    }
  } catch {
    // Best-effort logging only.
  }
}

type RateLimitFailOpenInput = {
  reason: 'redis_unavailable' | 'redis_error';
  keyPrefix: string;
  identifier?: string;
  userId?: string | null;
  fallbackMode: 'in_memory' | 'fail_closed';
};

export function logRateLimitFailOpenWarning(
  input: RateLimitFailOpenInput,
): void {
  const reasonLabel =
    input.reason === 'redis_unavailable' ? 'Redis unavailable' : 'Redis error';
  const message =
    input.fallbackMode === 'fail_closed'
      ? `[RateLimit] ${reasonLabel}. Denying requests because this limiter is fail-closed.`
      : `[RateLimit] ${reasonLabel}. Falling back to in-memory limiter (degraded enforcement).`;

  console.warn(message, {
    keyPrefix: input.keyPrefix,
    userId: input.userId ?? null,
    identifier: input.identifier ?? null,
    fallbackMode: input.fallbackMode,
  });

  if (IS_BUILD_PHASE) {
    return;
  }

  try {
    const admin = createSupabaseAdminClient();
    void withDbTimeout(
      admin.from('rate_limit_log').insert({
        identifier:
          input.userId ??
          input.identifier ??
          `degraded:${input.keyPrefix.replaceAll(':', '_')}`,
        endpoint: `[${input.fallbackMode}:${input.reason}] ${input.keyPrefix}`,
        request_count: 0,
        window_start: new Date().toISOString(),
        blocked_at: null,
        created_at: new Date().toISOString(),
      }),
      'rate_limit_log.fail_open_insert',
    );
  } catch {
    // Best-effort logging only.
  }
}
