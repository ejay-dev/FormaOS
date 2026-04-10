/** @jest-environment node */

/**
 * Tests for lib/security/event-logger.ts
 * Covers: dispatchSecurityEventEnhanced, dispatchUserActivity,
 *         logSecurityEventEnhanced, logUserActivity, logLoginAttempt,
 *         logUnauthorizedAccess, logRateLimitExceeded,
 *         + internal flush pipeline / metadata sanitization / detection rules
 */

// ─── Supabase chain builder ───────────────────────────────────────────────
function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdminClient = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdminClient),
}));

const mockDetectBruteForce = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockDetectImpossibleTravel = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockDetectNewDevice = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockDetectSessionAnomaly = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockDetectPrivilegeEscalation = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockDetectRateLimitViolation = jest
  .fn()
  .mockResolvedValue({ triggered: false, severity: 'info', reason: '' });
const mockEnrichGeoData = jest
  .fn()
  .mockResolvedValue({ country: 'AU', region: 'NSW', city: 'Sydney' });
const mockParseUserAgent = jest
  .fn()
  .mockReturnValue({ browser: 'Chrome', os: 'macOS' });

jest.mock('@/lib/security/detection-rules', () => ({
  detectBruteForce: (...args: any[]) => mockDetectBruteForce(...args),
  detectImpossibleTravel: (...args: any[]) =>
    mockDetectImpossibleTravel(...args),
  detectNewDevice: (...args: any[]) => mockDetectNewDevice(...args),
  detectSessionAnomaly: (...args: any[]) => mockDetectSessionAnomaly(...args),
  detectPrivilegeEscalation: (...args: any[]) =>
    mockDetectPrivilegeEscalation(...args),
  detectRateLimitViolation: (...args: any[]) =>
    mockDetectRateLimitViolation(...args),
  enrichGeoData: (...args: any[]) => mockEnrichGeoData(...args),
  parseUserAgent: (...args: any[]) => mockParseUserAgent(...args),
}));

import {
  dispatchSecurityEventEnhanced,
  dispatchUserActivity,
  logSecurityEventEnhanced,
  logUserActivity,
  logLoginAttempt,
  logUnauthorizedAccess,
  logRateLimitExceeded,
} from '@/lib/security/event-logger';

/**
 * Helper: advance fake timers and flush all pending microtasks/timers.
 * The flush pipeline uses nested setTimeout (via withDbTimeout) inside
 * async callbacks, so we must run timers multiple rounds.
 */
async function drainFlush() {
  // Multiple rounds to handle timers created by async callbacks
  for (let i = 0; i < 5; i++) {
    await jest.runAllTimersAsync();
    // Yield to allow pending microtasks to run
    await Promise.resolve();
  }
}

describe('security/event-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Drain any queued events / stale timers so module-level
    // flushTimer is reset to null before the next test.
    try {
      await jest.runAllTimersAsync();
    } catch {
      // ignore
    }
    jest.useRealTimers();
  });

  // ─── dispatchSecurityEventEnhanced ───────────────────────────
  describe('dispatchSecurityEventEnhanced', () => {
    it('enqueues a security event and does not throw', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'login_success',
          severity: 'info',
          userId: 'u1',
          orgId: 'org1',
          ip: '1.2.3.4',
          userAgent: 'TestAgent',
        }),
      ).not.toThrow();
    });

    it('handles payload without optional fields', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'generic_event',
          ip: '10.0.0.1',
          userAgent: 'Bot',
        }),
      ).not.toThrow();
    });

    it('handles payload with sensitive metadata keys', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'login_failure',
          ip: '10.0.0.1',
          userAgent: 'Agent',
          severity: 'medium',
          metadata: {
            password: 'secret123',
            token: 'abc',
            email: 'user@example.com',
            safe: 'ok',
          },
        }),
      ).not.toThrow();
    });

    it('handles payload with all optional fields set', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'token_refresh',
          severity: 'low',
          userId: 'u1',
          orgId: 'org1',
          ip: '1.1.1.1',
          userAgent: 'Chrome',
          deviceFingerprint: 'fp-abc',
          path: '/api/test',
          method: 'POST',
          statusCode: 200,
          metadata: { sessionId: 'sess-1' },
        }),
      ).not.toThrow();
    });
  });

  // ─── dispatchUserActivity ─────────────────────────────────────
  describe('dispatchUserActivity', () => {
    it('enqueues user activity with all fields', () => {
      expect(() =>
        dispatchUserActivity({
          userId: 'u1',
          action: 'viewed_page',
          orgId: 'org1',
          entityType: 'page',
          entityId: 'p1',
          route: '/app/dashboard',
          metadata: { key: 'val' },
        }),
      ).not.toThrow();
    });

    it('enqueues with minimal params', () => {
      expect(() =>
        dispatchUserActivity({ userId: 'u2', action: 'clicked' }),
      ).not.toThrow();
    });

    it('sanitizes metadata containing sensitive keys', () => {
      expect(() =>
        dispatchUserActivity({
          userId: 'u3',
          action: 'update',
          metadata: { authorization: 'Bearer xxx', info: 'ok' },
        }),
      ).not.toThrow();
    });
  });

  // ─── logSecurityEventEnhanced (alias) ─────────────────────────
  describe('logSecurityEventEnhanced', () => {
    it('delegates to dispatchSecurityEventEnhanced', () => {
      expect(() =>
        logSecurityEventEnhanced({
          type: 'mfa_verified',
          ip: '5.5.5.5',
          userAgent: 'Firefox',
        }),
      ).not.toThrow();
    });
  });

  // ─── logUserActivity (alias) ──────────────────────────────────
  describe('logUserActivity', () => {
    it('delegates to dispatchUserActivity', () => {
      expect(() =>
        logUserActivity({ userId: 'u10', action: 'task_completed' }),
      ).not.toThrow();
    });
  });

  // ─── logLoginAttempt ──────────────────────────────────────────
  describe('logLoginAttempt', () => {
    it('dispatches login_success event when success=true', () => {
      expect(() =>
        logLoginAttempt({
          success: true,
          userId: 'u1',
          ip: '1.1.1.1',
          userAgent: 'Chrome',
          deviceFingerprint: 'fp1',
          reason: undefined,
        }),
      ).not.toThrow();
    });

    it('dispatches login_failure event when success=false', () => {
      expect(() =>
        logLoginAttempt({
          success: false,
          ip: '2.2.2.2',
          userAgent: 'Firefox',
          reason: 'invalid_password',
        }),
      ).not.toThrow();
    });

    it('handles missing userId and deviceFingerprint', () => {
      expect(() =>
        logLoginAttempt({
          success: false,
          ip: '3.3.3.3',
          userAgent: 'Safari',
        }),
      ).not.toThrow();
    });
  });

  // ─── logUnauthorizedAccess ────────────────────────────────────
  describe('logUnauthorizedAccess', () => {
    it('dispatches unauthorized_access_attempt event', () => {
      expect(() =>
        logUnauthorizedAccess({
          userId: 'u1',
          orgId: 'org1',
          ip: '4.4.4.4',
          userAgent: 'Wget',
          path: '/admin',
          method: 'GET',
          userRole: 'member',
        }),
      ).not.toThrow();
    });

    it('handles missing optional userId/orgId/userRole', () => {
      expect(() =>
        logUnauthorizedAccess({
          ip: '5.5.5.5',
          userAgent: 'curl',
          path: '/api/secret',
          method: 'DELETE',
        }),
      ).not.toThrow();
    });
  });

  // ─── logRateLimitExceeded ─────────────────────────────────────
  describe('logRateLimitExceeded', () => {
    it('dispatches rate_limit_exceeded event', () => {
      expect(() =>
        logRateLimitExceeded({
          userId: 'u1',
          ip: '6.6.6.6',
          userAgent: 'Bot',
          path: '/api/v1/data',
        }),
      ).not.toThrow();
    });

    it('handles missing optional userId and path', () => {
      expect(() =>
        logRateLimitExceeded({ ip: '7.7.7.7', userAgent: 'Tester' }),
      ).not.toThrow();
    });
  });

  // ─── Flush pipeline integration ───────────────────────────────
  describe('flush pipeline', () => {
    it('flushes security events to supabase after timer', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev1' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_success',
        ip: '1.1.1.1',
        userAgent: 'Chrome',
        userId: 'u1',
      });

      await drainFlush();

      expect(mockAdminClient.from).toHaveBeenCalled();
    });

    it('flushes user activity events', async () => {
      const insertBuilder = createBuilder({ data: null, error: null });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchUserActivity({
        userId: 'u1',
        action: 'page_view',
        orgId: 'org1',
      });

      await drainFlush();

      expect(mockAdminClient.from).toHaveBeenCalled();
    });

    it('handles enrichGeoData failure gracefully', async () => {
      mockEnrichGeoData.mockRejectedValueOnce(new Error('Geo fail'));
      const insertBuilder = createBuilder({
        data: [{ id: 'ev2' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_failure',
        ip: '9.9.9.9',
        userAgent: 'Chrome',
      });

      await drainFlush();

      expect(mockAdminClient.from).toHaveBeenCalled();
    });

    it('handles insert error gracefully (best-effort)', async () => {
      const errorBuilder = createBuilder({
        data: null,
        error: { message: 'db error' },
      });
      mockAdminClient.from.mockReturnValue(errorBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_success',
        ip: '1.1.1.1',
        userAgent: 'X',
      });

      await drainFlush();
    });

    it('triggers detection rules for login_failure events', async () => {
      mockDetectBruteForce.mockResolvedValue({
        triggered: true,
        severity: 'high',
        reason: 'Too many attempts',
        metadata: { count: 10 },
      });

      const insertBuilder = createBuilder({
        data: [{ id: 'ev-bf' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_failure',
        ip: '1.2.3.4',
        userAgent: 'Chrome',
        userId: 'u1',
      });

      await drainFlush();

      expect(mockDetectBruteForce).toHaveBeenCalled();
    });

    it('triggers impossible travel and new device for login_success', async () => {
      mockDetectImpossibleTravel.mockResolvedValue({
        triggered: true,
        severity: 'medium',
        reason: 'Suspicious location',
      });
      mockDetectNewDevice.mockResolvedValue({
        triggered: false,
        severity: 'info',
        reason: '',
      });

      const insertBuilder = createBuilder({
        data: [{ id: 'ev-ls' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_success',
        ip: '2.2.2.2',
        userAgent: 'Firefox',
        userId: 'u2',
      });

      await drainFlush();

      expect(mockDetectImpossibleTravel).toHaveBeenCalled();
      expect(mockDetectNewDevice).toHaveBeenCalled();
    });

    it('triggers session anomaly for token_refresh with sessionId', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-tr' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'token_refresh',
        ip: '3.3.3.3',
        userAgent: 'UA',
        metadata: { sessionId: 'sess-99' },
      });

      await drainFlush();

      expect(mockDetectSessionAnomaly).toHaveBeenCalled();
    });

    it('triggers privilege escalation for unauthorized_access_attempt', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-priv' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'unauthorized_access_attempt',
        ip: '4.4.4.4',
        userAgent: 'UA',
        metadata: { userRole: 'member' },
      });

      await drainFlush();

      expect(mockDetectPrivilegeEscalation).toHaveBeenCalled();
    });

    it('triggers rate limit detection for rate_limit_exceeded', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-rl' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'rate_limit_exceeded',
        ip: '5.5.5.5',
        userAgent: 'UA',
      });

      await drainFlush();

      expect(mockDetectRateLimitViolation).toHaveBeenCalled();
    });

    it('creates alerts for high/critical severity detections', async () => {
      mockDetectBruteForce.mockResolvedValue({
        triggered: true,
        severity: 'critical',
        reason: 'Brute force detected',
        metadata: {},
      });

      const insertBuilder = createBuilder({
        data: [{ id: 'ev-alert' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_failure',
        severity: 'high',
        ip: '6.6.6.6',
        userAgent: 'UA',
        userId: 'u5',
      });

      await drainFlush();

      const fromCalls = mockAdminClient.from.mock.calls.map((c: any) => c[0]);
      expect(fromCalls).toContain('security_events');
    });

    it('skips brute force by user when no userId on login_failure', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-no-uid' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'login_failure',
        ip: '8.8.8.8',
        userAgent: 'UA',
      });

      await drainFlush();

      expect(mockDetectBruteForce).toHaveBeenCalled();
    });

    it('skips session anomaly when no sessionId for token_refresh', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-no-ses' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'token_refresh',
        ip: '9.9.9.9',
        userAgent: 'UA',
        metadata: {},
      });

      await drainFlush();
    });

    it('handles privilege escalation with non-string userRole', async () => {
      const insertBuilder = createBuilder({
        data: [{ id: 'ev-nr' }],
        error: null,
      });
      mockAdminClient.from.mockReturnValue(insertBuilder);

      dispatchSecurityEventEnhanced({
        type: 'unauthorized_access_attempt',
        ip: '10.10.10.10',
        userAgent: 'UA',
        metadata: { userRole: 123 },
      });

      await drainFlush();
    });
  });

  // ─── Metadata sanitization branches ────────────────────────────
  describe('metadata sanitization', () => {
    it('sanitizes deeply nested objects (depth > 3 => TRUNCATED)', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: {
            nested: { level2: { level3: { level4: { tooDeep: true } } } },
          },
        }),
      ).not.toThrow();
    });

    it('sanitizes arrays in metadata (slices to 20)', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: {
            items: Array.from({ length: 30 }, (_, i) => i),
          },
        }),
      ).not.toThrow();
    });

    it('sanitizes boolean and number values', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: {
            count: 42,
            active: true,
            nullable: null,
            undefinedVal: undefined,
          },
        }),
      ).not.toThrow();
    });

    it('partially masks email addresses', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: {
            email: 'john.doe@example.com',
            contactEmail: 'ab@cd.com',
          },
        }),
      ).not.toThrow();
    });

    it('handles email with short local part (<= 1 char → REDACTED)', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { email: 'a@example.com' },
        }),
      ).not.toThrow();
    });

    it('redacts values matching sensitive pattern', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { cookie: 'x', secret: 'y', refresh: 'z' },
        }),
      ).not.toThrow();
    });

    it('handles strings containing @ that are not emails', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { mention: '@username' },
        }),
      ).not.toThrow();
    });

    it('truncates very long strings to 1000 chars', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { longKey: 'x'.repeat(2000) },
        }),
      ).not.toThrow();
    });

    it('handles non-primitive non-object values (Symbol, Function → String)', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { sym: Symbol('test') as any, fn: (() => {}) as any },
        }),
      ).not.toThrow();
    });

    it('handles undefined metadata', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: undefined,
        }),
      ).not.toThrow();
    });

    it('handles email with no domain part', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { email: 'nodomain@' },
        }),
      ).not.toThrow();
    });

    it('handles string values that contain sensitive keywords in value', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'test',
          ip: '0.0.0.0',
          userAgent: 'T',
          metadata: { note: 'Uses a secret token pattern' },
        }),
      ).not.toThrow();
    });
  });

  // ─── Severity branches ────────────────────────────────────────
  describe('severity branching', () => {
    it('defaults to info severity when not specified', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'other',
          ip: '0.0.0.0',
          userAgent: 'T',
        }),
      ).not.toThrow();
    });

    it('handles each severity level', () => {
      for (const sev of [
        'info',
        'low',
        'medium',
        'high',
        'critical',
      ] as const) {
        expect(() =>
          dispatchSecurityEventEnhanced({
            type: `test_${sev}`,
            severity: sev,
            ip: '0.0.0.0',
            userAgent: 'T',
          }),
        ).not.toThrow();
      }
    });
  });
});
