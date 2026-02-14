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

export async function logRateLimitEvent(input: RateLimitLogInput): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from('rate_limit_log').insert({
      identifier: input.identifier,
      endpoint: input.endpoint,
      request_count: input.requestCount,
      window_start: new Date(input.windowStart).toISOString(),
      blocked_at: input.blocked ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    });

    if (input.blocked) {
      await logSecurityEvent({
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
  } catch (error) {
    console.error('[RateLimit] Failed to log rate limit event:', error);
  }
}

type RateLimitFailOpenInput = {
  reason: 'redis_unavailable' | 'redis_error';
  keyPrefix: string;
  identifier?: string;
  userId?: string | null;
};

export async function logRateLimitFailOpenWarning(
  input: RateLimitFailOpenInput,
): Promise<void> {
  const message =
    input.reason === 'redis_unavailable'
      ? '[RateLimit] Redis unavailable. Falling back to in-memory limiter (degraded enforcement).'
      : '[RateLimit] Redis error. Falling back to in-memory limiter (degraded enforcement).';

  console.warn(message, {
    keyPrefix: input.keyPrefix,
    userId: input.userId ?? null,
    identifier: input.identifier ?? null,
  });

  try {
    const admin = createSupabaseAdminClient();
    await admin.from('rate_limit_log').insert({
      identifier:
        input.userId ??
        input.identifier ??
        `degraded:${input.keyPrefix.replaceAll(':', '_')}`,
      endpoint: `[fail_open:${input.reason}] ${input.keyPrefix}`,
      request_count: 0,
      window_start: new Date().toISOString(),
      blocked_at: null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RateLimit] Failed to persist fail-open warning:', error);
  }
}
