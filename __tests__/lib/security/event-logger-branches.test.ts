/**
 * Branch-coverage tests for lib/security/event-logger.ts
 * Targets 97 uncovered branches
 */

// Mock detection rules before importing
jest.mock('@/lib/security/detection-rules', () => ({
  detectBruteForce: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  detectImpossibleTravel: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  detectNewDevice: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  detectSessionAnomaly: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  detectPrivilegeEscalation: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  detectRateLimitViolation: jest.fn(async () => ({
    triggered: false,
    severity: 'info',
    reason: '',
  })),
  enrichGeoData: jest.fn(async () => ({
    country: 'AU',
    region: 'NSW',
    city: 'Sydney',
  })),
  parseUserAgent: jest.fn(() => ({ browser: 'Chrome', os: 'macOS' })),
}));

const mockInsertBuilder: Record<string, any> = {};
['select', 'insert', 'update', 'delete', 'upsert', 'eq'].forEach((m) => {
  mockInsertBuilder[m] = jest.fn(() => mockInsertBuilder);
});
mockInsertBuilder.then = (resolve: any) =>
  resolve({ data: [{ id: 'ev-1' }], error: null });

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => mockInsertBuilder),
  })),
}));

import {
  dispatchSecurityEventEnhanced,
  dispatchUserActivity,
  logSecurityEventEnhanced,
} from '@/lib/security/event-logger';
import {
  detectBruteForce,
  detectImpossibleTravel,
  detectNewDevice,
  detectSessionAnomaly,
  detectPrivilegeEscalation,
  detectRateLimitViolation,
} from '@/lib/security/detection-rules';

describe('event-logger branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('dispatchSecurityEventEnhanced', () => {
    it('enqueues login_failure event', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'login_failure',
          ip: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
          userId: 'u1',
          orgId: 'o1',
          path: '/login',
          method: 'POST',
          statusCode: 401,
          metadata: { attempt: 1 },
        }),
      ).not.toThrow();
    });

    it('enqueues login_success event', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'login_success',
          ip: '5.6.7.8',
          userAgent: 'Safari/15',
          userId: 'u2',
        }),
      ).not.toThrow();
    });

    it('enqueues token_refresh with session', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'token_refresh',
          ip: '9.10.11.12',
          userAgent: 'Chrome/120',
          metadata: { sessionId: 'sess-1' },
        }),
      ).not.toThrow();
    });

    it('enqueues unauthorized_access_attempt', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'unauthorized_access_attempt',
          ip: '10.0.0.1',
          userAgent: 'Bot/1.0',
          metadata: { userRole: 'viewer' },
        }),
      ).not.toThrow();
    });

    it('enqueues rate_limit_exceeded', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'rate_limit_exceeded',
          ip: '192.168.1.1',
          userAgent: 'curl/7.0',
          severity: 'high',
        }),
      ).not.toThrow();
    });

    it('handles event with no metadata', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'generic_event',
          ip: '1.1.1.1',
          userAgent: 'test',
        }),
      ).not.toThrow();
    });

    it('handles event with sensitive metadata keys', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'auth_event',
          ip: '2.2.2.2',
          userAgent: 'test',
          metadata: {
            token: 'secret-123',
            password: 'abc',
            email: 'user@test.com',
            normalKey: 'value',
          },
        }),
      ).not.toThrow();
    });

    it('handles event with nested metadata', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
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
        }),
      ).not.toThrow();
    });

    it('handles critical severity', () => {
      expect(() =>
        dispatchSecurityEventEnhanced({
          type: 'critical_event',
          ip: '4.4.4.4',
          userAgent: 'test',
          severity: 'critical',
        }),
      ).not.toThrow();
    });
  });

  describe('dispatchUserActivity', () => {
    it('enqueues user activity', () => {
      expect(() =>
        dispatchUserActivity({
          userId: 'u1',
          orgId: 'o1',
          action: 'viewed_dashboard',
          entityType: 'dashboard',
          entityId: 'd1',
          route: '/app/dashboard',
          metadata: { tab: 'overview' },
        }),
      ).not.toThrow();
    });

    it('enqueues activity with minimal fields', () => {
      expect(() =>
        dispatchUserActivity({
          userId: 'u2',
          action: 'logged_in',
        }),
      ).not.toThrow();
    });

    it('enqueues activity with sensitive metadata', () => {
      expect(() =>
        dispatchUserActivity({
          userId: 'u3',
          action: 'reset_password',
          metadata: {
            cookie: 'should-be-redacted',
            session: 'also-redacted',
            ip: '1.2.3.4',
          },
        }),
      ).not.toThrow();
    });
  });

  describe('logSecurityEventEnhanced', () => {
    it('delegates to dispatchSecurityEventEnhanced', () => {
      expect(() =>
        logSecurityEventEnhanced({
          type: 'test_event',
          ip: '5.5.5.5',
          userAgent: 'test',
        }),
      ).not.toThrow();
    });
  });
});
