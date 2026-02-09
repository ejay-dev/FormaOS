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

