/** @jest-environment node */

/**
 * Branch-coverage tests for lib/security/event-logger.ts
 *
 * Every case here drains the flush queue and asserts the row that reaches
 * the database. Enqueueing is fire-and-forget, so a test that only asserts
 * "did not throw" cannot fail when redaction, detection dispatch or the
 * insert payload regresses.
 */

const mockDetectBruteForce = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockDetectImpossibleTravel = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockDetectNewDevice = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockDetectSessionAnomaly = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockDetectPrivilegeEscalation = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockDetectRateLimitViolation = jest.fn(async () => ({
  triggered: false,
  severity: 'info',
  reason: '',
}));
const mockEnrichGeoData = jest.fn(async () => ({
  country: 'AU',
  region: 'NSW',
  city: 'Sydney',
}));
const mockParseUserAgent = jest.fn(() => ({
  browser: 'Chrome',
  os: 'macOS',
}));

jest.mock('@/lib/security/detection-rules', () => ({
  detectBruteForce: (...args: any[]) => mockDetectBruteForce(...(args as [])),
  detectImpossibleTravel: (...args: any[]) =>
    mockDetectImpossibleTravel(...(args as [])),
  detectNewDevice: (...args: any[]) => mockDetectNewDevice(...(args as [])),
  detectSessionAnomaly: (...args: any[]) =>
    mockDetectSessionAnomaly(...(args as [])),
  detectPrivilegeEscalation: (...args: any[]) =>
    mockDetectPrivilegeEscalation(...(args as [])),
  detectRateLimitViolation: (...args: any[]) =>
    mockDetectRateLimitViolation(...(args as [])),
  enrichGeoData: (...args: any[]) => mockEnrichGeoData(...(args as [])),
  parseUserAgent: (...args: any[]) => mockParseUserAgent(...(args as [])),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'in'].forEach(
    (m) => {
      b[m] = jest.fn(() => b);
    },
  );
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdminClient = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdminClient),
}));

import {
  dispatchSecurityEventEnhanced,
  dispatchUserActivity,
  logSecurityEventEnhanced,
} from '@/lib/security/event-logger';

type CapturedInsert = { table: string; rows: any };

/** Record every insert the flush pipeline performs, per table. */
function captureInserts(results: Record<string, any> = {}): CapturedInsert[] {
  const captured: CapturedInsert[] = [];
  mockAdminClient.from.mockImplementation(((table: string) => {
    const builder = createBuilder(
      results[table] ?? { data: [{ id: `${table}-row` }], error: null },
    );
    const originalInsert = builder.insert;
    builder.insert = jest.fn((rows: any) => {
      captured.push({ table, rows });
      return originalInsert(rows);
    });
    return builder;
  }) as any);
  return captured;
}

async function drainFlush() {
  for (let i = 0; i < 5; i++) {
    await jest.runAllTimersAsync();
    await Promise.resolve();
  }
}

function securityRows(captured: CapturedInsert[]) {
  return captured
    .filter((e) => e.table === 'security_events' && Array.isArray(e.rows))
    .flatMap((e) => e.rows as any[]);
}

/** Dispatch one event, flush, and return the persisted security_events row. */
async function flushSecurityRow(payload: any, results?: Record<string, any>) {
  const captured = captureInserts(results);
  dispatchSecurityEventEnhanced(payload);
  await drainFlush();
  const row = securityRows(captured).find((r) => r.type === payload.type);
  expect(row).toBeDefined();
  return { row: row as Record<string, any>, captured };
}

async function flushActivityRow(payload: any) {
  const captured = captureInserts({
    organizations: {
      data: payload.orgId ? [{ id: payload.orgId }] : [],
      error: null,
    },
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

describe('event-logger branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    try {
      await jest.runAllTimersAsync();
    } catch {
      // ignore
    }
    jest.useRealTimers();
  });

  describe('dispatchSecurityEventEnhanced', () => {
    it('enqueues login_failure event', async () => {
      const { row } = await flushSecurityRow({
        type: 'login_failure',
        ip: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
        userId: 'u1',
        orgId: 'o1',
        path: '/login',
        method: 'POST',
        statusCode: 401,
        metadata: { attempt: 1 },
      });

      expect(row).toMatchObject({
        type: 'login_failure',
        severity: 'info',
        user_id: 'u1',
        org_id: 'o1',
        ip_address: '1.2.3.4',
        request_path: '/login',
        request_method: 'POST',
        status_code: 401,
      });
      expect(row.metadata.attempt).toBe(1);
      // Both brute-force scopes run once a userId is known.
      expect(mockDetectBruteForce).toHaveBeenCalledWith(expect.anything(), {
        by: 'ip',
        value: '1.2.3.4',
      });
      expect(mockDetectBruteForce).toHaveBeenCalledWith(expect.anything(), {
        by: 'user',
        value: 'u1',
      });
    });

    it('enqueues login_success event', async () => {
      const { row } = await flushSecurityRow({
        type: 'login_success',
        ip: '5.6.7.8',
        userAgent: 'Safari/15',
        userId: 'u2',
      });

      expect(row.user_id).toBe('u2');
      expect(mockDetectImpossibleTravel).toHaveBeenCalledTimes(1);
      expect(mockDetectNewDevice).toHaveBeenCalledTimes(1);
      expect(mockDetectBruteForce).not.toHaveBeenCalled();
    });

    it('enqueues token_refresh with session', async () => {
      await flushSecurityRow({
        type: 'token_refresh',
        ip: '9.10.11.12',
        userAgent: 'Chrome/120',
        metadata: { sessionId: 'sess-1' },
      });

      expect(mockDetectSessionAnomaly).toHaveBeenCalledWith(
        'sess-1',
        expect.objectContaining({ ip: '9.10.11.12' }),
      );
    });

    it('enqueues unauthorized_access_attempt', async () => {
      await flushSecurityRow({
        type: 'unauthorized_access_attempt',
        ip: '10.0.0.1',
        userAgent: 'Bot/1.0',
        metadata: { userRole: 'viewer' },
      });

      expect(mockDetectPrivilegeEscalation).toHaveBeenCalledWith(
        expect.objectContaining({ ip: '10.0.0.1' }),
        'viewer',
      );
    });

    it('enqueues rate_limit_exceeded', async () => {
      const { row } = await flushSecurityRow({
        type: 'rate_limit_exceeded',
        ip: '192.168.1.1',
        userAgent: 'curl/7.0',
        severity: 'high',
      });

      expect(row.severity).toBe('high');
      expect(mockDetectRateLimitViolation).toHaveBeenCalledTimes(1);
    });

    it('handles event with no metadata', async () => {
      const { row } = await flushSecurityRow({
        type: 'generic_event',
        ip: '1.1.1.1',
        userAgent: 'test',
      });

      // Only the parsed device info is stored when no metadata is supplied.
      expect(row.metadata).toEqual({ browser: 'Chrome', os: 'macOS' });
      expect(row.geo_country).toBe('AU');
    });

    it('handles event with sensitive metadata keys', async () => {
      const { row } = await flushSecurityRow({
        type: 'auth_event',
        ip: '2.2.2.2',
        userAgent: 'test',
        metadata: {
          token: 'secret-123',
          password: 'abc',
          email: 'user@test.com',
          normalKey: 'value',
        },
      });

      expect(row.metadata.token).toBe('[REDACTED]');
      expect(row.metadata.password).toBe('[REDACTED]');
      expect(row.metadata.email).toBe('us***@test.com');
      expect(row.metadata.normalKey).toBe('value');
      expect(JSON.stringify(row.metadata)).not.toContain('secret-123');
    });

    it('handles event with nested metadata', async () => {
      const { row } = await flushSecurityRow({
        type: 'nested_event',
        ip: '3.3.3.3',
        userAgent: 'test',
        metadata: {
          user: {
            authorization: 'bearer xyz',
            name: 'Test User',
            details: {
              deep: {
                veryDeep: {
                  level4: true,
                },
              },
            },
          },
          items: [1, 2, 3, 'four'],
        },
      });

      // Redaction recurses into nested objects.
      expect(row.metadata.user.authorization).toBe('[REDACTED]');
      expect(row.metadata.user.name).toBe('Test User');
      // Depth guard kicks in past level 3.
      expect(row.metadata.user.details.deep.veryDeep.level4).toBe(
        '[TRUNCATED]',
      );
      expect(row.metadata.items).toEqual([1, 2, 3, 'four']);
      expect(JSON.stringify(row.metadata)).not.toContain('bearer xyz');
    });

    it('handles critical severity', async () => {
      const { row, captured } = await flushSecurityRow({
        type: 'critical_event',
        ip: '4.4.4.4',
        userAgent: 'test',
        severity: 'critical',
      });

      expect(row.severity).toBe('critical');
      // Critical events raise an alert even with no detection triggered.
      const alertInsert = captured.find((e) => e.table === 'security_alerts');
      expect(alertInsert).toBeDefined();
      expect(alertInsert!.rows).toEqual([
        {
          event_id: 'security_events-row',
          notes: 'Auto-generated: Auto-generated critical event',
        },
      ]);
    });

    it('does not raise an alert for low severity events', async () => {
      const { captured } = await flushSecurityRow({
        type: 'low_severity_event',
        ip: '4.4.4.5',
        userAgent: 'test',
        severity: 'low',
      });

      expect(captured.some((e) => e.table === 'security_alerts')).toBe(false);
    });
  });

  describe('dispatchUserActivity', () => {
    it('enqueues user activity', async () => {
      const row = await flushActivityRow({
        userId: 'u1',
        orgId: 'o1',
        action: 'viewed_dashboard',
        entityType: 'dashboard',
        entityId: 'd1',
        route: '/app/dashboard',
        metadata: { tab: 'overview' },
      });

      expect(row).toMatchObject({
        user_id: 'u1',
        org_id: 'o1',
        action: 'viewed_dashboard',
        entity_type: 'dashboard',
        entity_id: 'd1',
        route: '/app/dashboard',
      });
      expect(row.metadata.tab).toBe('overview');
    });

    it('enqueues activity with minimal fields', async () => {
      const row = await flushActivityRow({
        userId: 'u2',
        action: 'logged_in',
      });

      expect(row).toMatchObject({
        user_id: 'u2',
        action: 'logged_in',
        org_id: undefined,
      });
      expect(row.metadata).toEqual({});
    });

    it('enqueues activity with sensitive metadata', async () => {
      const row = await flushActivityRow({
        userId: 'u3',
        action: 'reset_password',
        metadata: {
          cookie: 'should-be-redacted',
          session: 'also-redacted',
          ip: '1.2.3.4',
        },
      });

      expect(row.metadata.cookie).toBe('[REDACTED]');
      expect(row.metadata.session).toBe('[REDACTED]');
      expect(row.metadata.ip).toBe('1.2.3.4');
      expect(JSON.stringify(row.metadata)).not.toContain('should-be-redacted');
    });
  });

  describe('logSecurityEventEnhanced', () => {
    it('delegates to dispatchSecurityEventEnhanced', async () => {
      const captured = captureInserts();
      logSecurityEventEnhanced({
        type: 'test_event',
        ip: '5.5.5.5',
        userAgent: 'test',
      });
      await drainFlush();

      expect(
        securityRows(captured).some(
          (r) => r.type === 'test_event' && r.ip_address === '5.5.5.5',
        ),
      ).toBe(true);
    });
  });
});
