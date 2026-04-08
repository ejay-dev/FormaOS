/**
 * Tests for lib/security/rate-limit-log.ts
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const __admin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => __admin),
}));

jest.mock('@/lib/security/session-security', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventTypes: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  },
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  delete process.env.NEXT_PHASE;
});

afterAll(() => {
  process.env = originalEnv;
});

import {
  logRateLimitEvent,
  logRateLimitFailOpenWarning,
} from '@/lib/security/rate-limit-log';
import { logSecurityEvent } from '@/lib/security/session-security';

describe('logRateLimitEvent', () => {
  it('inserts log to database', () => {
    logRateLimitEvent({
      identifier: 'user-1',
      endpoint: '/api/test',
      requestCount: 100,
      windowStart: Date.now(),
      blocked: false,
    });

    expect(__admin.from).toHaveBeenCalledWith('rate_limit_log');
  });

  it('logs security event when blocked', () => {
    logRateLimitEvent({
      identifier: 'user-1',
      endpoint: '/api/test',
      requestCount: 100,
      windowStart: Date.now(),
      blocked: true,
      userId: 'user-1',
      organizationId: 'org-1',
      ipAddress: '1.2.3.4',
      userAgent: 'test-agent',
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'rate_limit_exceeded',
        userId: 'user-1',
        organizationId: 'org-1',
        ipAddress: '1.2.3.4',
        userAgent: 'test-agent',
      }),
    );
  });

  it('does not log security event when not blocked', () => {
    logRateLimitEvent({
      identifier: 'user-1',
      endpoint: '/api/test',
      requestCount: 50,
      windowStart: Date.now(),
      blocked: false,
    });

    expect(logSecurityEvent).not.toHaveBeenCalled();
  });

  it('skips during build phase', () => {
    process.env.NEXT_PHASE = 'phase-production-build';

    // Need to re-import to pick up new env
    jest.resetModules();
    jest.mock('@/lib/supabase/admin', () => ({
      createSupabaseAdminClient: jest.fn(() => __admin),
    }));
    jest.mock('@/lib/security/session-security', () => ({
      logSecurityEvent: jest.fn(),
      SecurityEventTypes: { RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded' },
    }));

    const {
      logRateLimitEvent: freshLog,
    } = require('@/lib/security/rate-limit-log');
    freshLog({
      identifier: 'user-1',
      endpoint: '/api/test',
      requestCount: 100,
      windowStart: Date.now(),
      blocked: true,
    });

    expect(__admin.from).not.toHaveBeenCalled();
  });

  it('handles missing optional fields', () => {
    logRateLimitEvent({
      identifier: 'anon',
      endpoint: '/api/public',
      requestCount: 10,
      windowStart: Date.now(),
      blocked: true,
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: undefined,
        organizationId: undefined,
      }),
    );
  });
});

describe('logRateLimitFailOpenWarning', () => {
  it('logs warning for redis_unavailable with in_memory fallback', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    logRateLimitFailOpenWarning({
      reason: 'redis_unavailable',
      keyPrefix: 'api:rate_limit',
      fallbackMode: 'in_memory',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Redis unavailable'),
      expect.anything(),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('in-memory'),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it('logs warning for redis_error with fail_closed', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    logRateLimitFailOpenWarning({
      reason: 'redis_error',
      keyPrefix: 'api:auth',
      fallbackMode: 'fail_closed',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Redis error'),
      expect.anything(),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('fail-closed'),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it('writes degraded event to database', () => {
    jest.spyOn(console, 'warn').mockImplementation();

    logRateLimitFailOpenWarning({
      reason: 'redis_unavailable',
      keyPrefix: 'api:test',
      userId: 'user-1',
      identifier: 'id-1',
      fallbackMode: 'in_memory',
    });

    expect(__admin.from).toHaveBeenCalledWith('rate_limit_log');
    jest.restoreAllMocks();
  });

  it('uses userId for identifier when available', () => {
    jest.spyOn(console, 'warn').mockImplementation();

    logRateLimitFailOpenWarning({
      reason: 'redis_unavailable',
      keyPrefix: 'api:test',
      userId: 'user-1',
      fallbackMode: 'in_memory',
    });

    expect(__admin.from).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('skips DB write during build phase', () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation();

    jest.resetModules();
    jest.mock('@/lib/supabase/admin', () => ({
      createSupabaseAdminClient: jest.fn(() => __admin),
    }));
    jest.mock('@/lib/security/session-security', () => ({
      logSecurityEvent: jest.fn(),
      SecurityEventTypes: { RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded' },
    }));

    __admin.from.mockClear();

    const {
      logRateLimitFailOpenWarning: freshLog,
    } = require('@/lib/security/rate-limit-log');
    freshLog({
      reason: 'redis_unavailable',
      keyPrefix: 'api:test',
      fallbackMode: 'in_memory',
    });

    expect(__admin.from).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
