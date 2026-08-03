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

type CapturedInsert = { table: string; rows: any };

/**
 * Record every `.insert()` the flush pipeline performs, per table, so tests
 * can assert the rows that actually reach the database instead of only that
 * the enqueue call did not throw.
 */
function captureInserts(
  results: Record<string, any> = {},
): CapturedInsert[] {
  const captured: CapturedInsert[] = [];
  mockAdminClient.from.mockImplementation((table: string) => {
    const builder = createBuilder(
      results[table] ?? { data: [{ id: `${table}-row` }], error: null },
    );
    const originalInsert = builder.insert;
    builder.insert = jest.fn((rows: any) => {
      captured.push({ table, rows });
      return originalInsert(rows);
    });
    return builder;
  });
  return captured;
}

function securityRows(captured: CapturedInsert[]) {
  return captured
    .filter((e) => e.table === 'security_events' && Array.isArray(e.rows))
    .flatMap((e) => e.rows as any[]);
}

/**
 * Dispatch one security event, run the flush pipeline, and return the row
 * written to security_events. Types must be unique per test so a row left
 * over from a previous test cannot satisfy the lookup.
 */
async function flushSecurityRow(payload: any) {
  const captured = captureInserts();
  dispatchSecurityEventEnhanced(payload);
  await drainFlush();
  const row = securityRows(captured).find((r) => r.type === payload.type);
  expect(row).toBeDefined();
  return row as Record<string, any>;
}

async function flushActivityRow(payload: any) {
  const captured = captureInserts({
    organizations: { data: [{ id: payload.orgId }], error: null },
  });
  dispatchUserActivity(payload);
  await drainFlush();
  const row = captured
    .filter((e) => e.table === 'user_activity' && Array.isArray(e.rows))
    .flatMap((e) => e.rows as any[])
    .find((r) => r.action === payload.action);
  expect(row).toBeDefined();
  return row as Record<string, any>;
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

    it('redacts sensitive metadata keys before the row is written', async () => {
      const row = await flushSecurityRow({
        type: 'dispatch_sensitive_metadata',
        ip: '10.0.0.1',
        userAgent: 'Agent',
        severity: 'medium',
        metadata: {
          password: 'secret123',
          token: 'abc',
          email: 'user@example.com',
          safe: 'ok',
        },
      });

      expect(row.metadata.password).toBe('[REDACTED]');
      expect(row.metadata.token).toBe('[REDACTED]');
      expect(row.metadata.email).toBe('us***@example.com');
      expect(row.metadata.safe).toBe('ok');
      expect(JSON.stringify(row.metadata)).not.toContain('secret123');
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

    it('sanitizes metadata containing sensitive keys', async () => {
      const row = await flushActivityRow({
        userId: 'u3',
        orgId: 'org-activity-sensitive',
        action: 'activity_sensitive_metadata',
        metadata: { authorization: 'Bearer xxx', info: 'ok' },
      });

      expect(row.metadata.authorization).toBe('[REDACTED]');
      expect(row.metadata.info).toBe('ok');
      expect(JSON.stringify(row.metadata)).not.toContain('Bearer xxx');
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
      const row = await flushSecurityRow({
        type: 'flush_security_row',
        ip: '1.1.1.1',
        userAgent: 'Chrome',
        userId: 'u1',
        orgId: 'org1',
        path: '/api/x',
        method: 'GET',
        statusCode: 200,
      });

      expect(row).toMatchObject({
        type: 'flush_security_row',
        severity: 'info',
        user_id: 'u1',
        org_id: 'org1',
        ip_address: '1.1.1.1',
        user_agent: 'Chrome',
        request_path: '/api/x',
        request_method: 'GET',
        status_code: 200,
        geo_country: 'AU',
        geo_city: 'Sydney',
      });
    });

    it('flushes user activity events', async () => {
      const row = await flushActivityRow({
        userId: 'u1',
        action: 'flush_activity_row',
        orgId: 'org1',
        entityType: 'page',
        entityId: 'p1',
        route: '/app/dashboard',
      });

      expect(row).toMatchObject({
        user_id: 'u1',
        org_id: 'org1',
        action: 'flush_activity_row',
        entity_type: 'page',
        entity_id: 'p1',
        route: '/app/dashboard',
      });
    });

    it('drops activity rows whose org no longer exists', async () => {
      const captured = captureInserts({
        organizations: { data: [], error: null },
      });

      dispatchUserActivity({
        userId: 'u1',
        action: 'activity_orphan_org',
        orgId: 'org-does-not-exist',
      });

      await drainFlush();

      const activityRows = captured
        .filter((e) => e.table === 'user_activity' && Array.isArray(e.rows))
        .flatMap((e) => e.rows as any[]);
      expect(
        activityRows.some((r) => r.action === 'activity_orphan_org'),
      ).toBe(false);
    });

    it('handles enrichGeoData failure gracefully', async () => {
      mockEnrichGeoData.mockRejectedValueOnce(new Error('Geo fail'));

      const row = await flushSecurityRow({
        type: 'flush_geo_failure',
        ip: '9.9.9.9',
        userAgent: 'Chrome',
      });

      // The event is still persisted, just without geo enrichment.
      expect(row.geo_country).toBeUndefined();
      expect(row.ip_address).toBe('9.9.9.9');
    });

    it('handles insert error gracefully (best-effort)', async () => {
      const captured = captureInserts({
        security_events: { data: null, error: { message: 'db error' } },
      });

      dispatchSecurityEventEnhanced({
        type: 'flush_insert_error',
        severity: 'critical',
        ip: '1.1.1.1',
        userAgent: 'X',
      });

      await drainFlush();

      // The insert was attempted, but nothing downstream runs on failure:
      // no alert row is created off an event that was never stored.
      expect(
        securityRows(captured).some((r) => r.type === 'flush_insert_error'),
      ).toBe(true);
      expect(captured.some((e) => e.table === 'security_alerts')).toBe(false);
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

      const captured = captureInserts();

      dispatchSecurityEventEnhanced({
        type: 'login_failure',
        severity: 'high',
        ip: '6.6.6.6',
        userAgent: 'UA',
        userId: 'u5',
      });

      await drainFlush();

      const alertInsert = captured.find(
        (e) => e.table === 'security_alerts',
      );
      expect(alertInsert).toBeDefined();
      expect(alertInsert!.rows).toEqual([
        {
          event_id: 'security_events-row',
          notes: 'Auto-generated: Brute force detected',
        },
      ]);
    });

    it('skips brute force by user when no userId on login_failure', async () => {
      await flushSecurityRow({
        type: 'login_failure',
        ip: '8.8.8.8',
        userAgent: 'UA',
      });

      // Only the IP-scoped check runs when the attempt is anonymous.
      expect(mockDetectBruteForce).toHaveBeenCalledTimes(1);
      expect(mockDetectBruteForce).toHaveBeenCalledWith(
        expect.objectContaining({ ip: '8.8.8.8' }),
        { by: 'ip', value: '8.8.8.8' },
      );
    });

    it('skips session anomaly when no sessionId for token_refresh', async () => {
      await flushSecurityRow({
        type: 'token_refresh',
        ip: '9.9.9.9',
        userAgent: 'UA',
        metadata: {},
      });

      expect(mockDetectSessionAnomaly).not.toHaveBeenCalled();
    });

    it('handles privilege escalation with non-string userRole', async () => {
      await flushSecurityRow({
        type: 'unauthorized_access_attempt',
        ip: '10.10.10.10',
        userAgent: 'UA',
        metadata: { userRole: 123 },
      });

      expect(mockDetectPrivilegeEscalation).toHaveBeenCalledWith(
        expect.objectContaining({ ip: '10.10.10.10' }),
        undefined,
      );
    });
  });

  // ─── Metadata sanitization branches ────────────────────────────
  // These assert the metadata column as written to security_events: if the
  // redaction/masking/truncation logic is removed, raw secrets reach the DB
  // and every one of these fails.
  describe('metadata sanitization', () => {
    it('sanitizes deeply nested objects (depth > 3 => TRUNCATED)', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_depth',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: {
          nested: { level2: { level3: { level4: { tooDeep: true } } } },
        },
      });

      expect(row.metadata.nested.level2.level3.level4.tooDeep).toBe(
        '[TRUNCATED]',
      );
    });

    it('sanitizes arrays in metadata (slices to 20)', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_array',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: {
          items: Array.from({ length: 30 }, (_, i) => i),
        },
      });

      expect(row.metadata.items).toHaveLength(20);
      expect(row.metadata.items[19]).toBe(19);
    });

    it('sanitizes boolean and number values', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_primitives',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: {
          count: 42,
          active: true,
          nullable: null,
          undefinedVal: undefined,
        },
      });

      expect(row.metadata.count).toBe(42);
      expect(row.metadata.active).toBe(true);
      expect(row.metadata.nullable).toBeNull();
      expect(row.metadata.undefinedVal).toBeUndefined();
    });

    it('partially masks email addresses', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_email',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: {
          email: 'john.doe@example.com',
          contactEmail: 'ab@cd.com',
        },
      });

      expect(row.metadata.email).toBe('jo***@example.com');
      expect(row.metadata.contactEmail).toBe('ab***@cd.com');
    });

    it('handles email with short local part (<= 1 char → REDACTED)', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_short_email',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { email: 'a@example.com' },
      });

      expect(row.metadata.email).toBe('[REDACTED]');
    });

    it('redacts values matching sensitive pattern', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_sensitive_keys',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { cookie: 'x', secret: 'y', refresh: 'z', safe: 'keep-me' },
      });

      expect(row.metadata.cookie).toBe('[REDACTED]');
      expect(row.metadata.secret).toBe('[REDACTED]');
      expect(row.metadata.refresh).toBe('[REDACTED]');
      expect(row.metadata.safe).toBe('keep-me');
    });

    it('handles strings containing @ that are not emails', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_mention',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { mention: '@username' },
      });

      expect(row.metadata.mention).toBe('[REDACTED]');
    });

    it('truncates very long strings to 1000 chars', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_long_string',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { longKey: 'x'.repeat(2000) },
      });

      expect(row.metadata.longKey).toHaveLength(1000);
    });

    it('handles non-primitive non-object values (Symbol, Function → String)', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_symbol',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { sym: Symbol('marker') as any, fn: (() => {}) as any },
      });

      expect(row.metadata.sym).toBe('Symbol(marker)');
      expect(typeof row.metadata.fn).toBe('string');
    });

    it('handles undefined metadata', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_undefined',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: undefined,
      });

      // Only the parsed device info survives.
      expect(row.metadata).toEqual({ browser: 'Chrome', os: 'macOS' });
    });

    it('handles email with no domain part', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_no_domain',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { email: 'nodomain@' },
      });

      expect(row.metadata.email).toBe('[REDACTED]');
    });

    it('handles string values that contain sensitive keywords in value', async () => {
      const row = await flushSecurityRow({
        type: 'sanitize_sensitive_value',
        ip: '0.0.0.0',
        userAgent: 'T',
        metadata: { note: 'Uses a secret token pattern' },
      });

      expect(row.metadata.note).toBe('[REDACTED]');
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
