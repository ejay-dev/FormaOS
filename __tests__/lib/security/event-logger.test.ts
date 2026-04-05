/** @jest-environment node */
jest.mock('server-only', () => ({}));

// Must mock detection-rules BEFORE importing event-logger
jest.mock('@/lib/security/detection-rules', () => ({
  detectBruteForce: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  detectImpossibleTravel: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  detectNewDevice: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  detectSessionAnomaly: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  detectPrivilegeEscalation: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  detectRateLimitViolation: jest
    .fn()
    .mockResolvedValue({ triggered: false, severity: 'info', reason: '' }),
  enrichGeoData: jest
    .fn()
    .mockResolvedValue({ country: 'US', region: 'CA', city: 'SF' }),
  parseUserAgent: jest.fn().mockReturnValue({ browser: 'Chrome', os: 'macOS' }),
}));

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
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  dispatchSecurityEventEnhanced,
  dispatchUserActivity,
  logSecurityEventEnhanced,
  logUserActivity,
  logLoginAttempt,
  logUnauthorizedAccess,
  logRateLimitExceeded,
} from '@/lib/security/event-logger';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const basePayload = {
  type: 'login_success',
  ip: '1.2.3.4',
  userAgent: 'Mozilla/5.0',
};

describe('dispatchSecurityEventEnhanced', () => {
  it('enqueues an event without throwing', () => {
    expect(() =>
      dispatchSecurityEventEnhanced({ ...basePayload }),
    ).not.toThrow();
  });

  it('accepts all optional fields', () => {
    expect(() =>
      dispatchSecurityEventEnhanced({
        ...basePayload,
        severity: 'high',
        userId: 'u1',
        orgId: 'org-1',
        deviceFingerprint: 'fp1',
        path: '/api/test',
        method: 'POST',
        statusCode: 200,
        metadata: { key: 'val' },
      }),
    ).not.toThrow();
  });
});

describe('dispatchUserActivity', () => {
  it('enqueues user activity without throwing', () => {
    expect(() =>
      dispatchUserActivity({
        userId: 'u1',
        action: 'page_view',
        entityType: 'page',
        entityId: 'p1',
        route: '/dashboard',
      }),
    ).not.toThrow();
  });
});

describe('logSecurityEventEnhanced', () => {
  it('delegates to dispatchSecurityEventEnhanced', () => {
    expect(() => logSecurityEventEnhanced({ ...basePayload })).not.toThrow();
  });
});

describe('logUserActivity', () => {
  it('delegates to dispatchUserActivity', () => {
    expect(() =>
      logUserActivity({ userId: 'u1', action: 'click' }),
    ).not.toThrow();
  });
});

describe('logLoginAttempt', () => {
  it('dispatches login_success event', () => {
    expect(() =>
      logLoginAttempt({
        success: true,
        userId: 'u1',
        ip: '1.2.3.4',
        userAgent: 'Test',
      }),
    ).not.toThrow();
  });

  it('dispatches login_failure event', () => {
    expect(() =>
      logLoginAttempt({
        success: false,
        ip: '1.2.3.4',
        userAgent: 'Test',
        reason: 'bad password',
      }),
    ).not.toThrow();
  });
});

describe('logUnauthorizedAccess', () => {
  it('dispatches unauthorized_access_attempt event', () => {
    expect(() =>
      logUnauthorizedAccess({
        userId: 'u1',
        orgId: 'org-1',
        ip: '5.6.7.8',
        userAgent: 'Test',
        path: '/admin',
        method: 'GET',
        userRole: 'member',
      }),
    ).not.toThrow();
  });
});

describe('logRateLimitExceeded', () => {
  it('dispatches rate_limit_exceeded event', () => {
    expect(() =>
      logRateLimitExceeded({
        userId: 'u1',
        ip: '1.2.3.4',
        userAgent: 'Test',
        path: '/api/data',
      }),
    ).not.toThrow();
  });
});

describe('multiple events', () => {
  it('queues multiple events without error', () => {
    for (let i = 0; i < 10; i++) {
      expect(() =>
        dispatchSecurityEventEnhanced({ ...basePayload, type: `event_${i}` }),
      ).not.toThrow();
    }
  });

  it('queues multiple activity records without error', () => {
    for (let i = 0; i < 10; i++) {
      expect(() =>
        dispatchUserActivity({ userId: `u${i}`, action: `action_${i}` }),
      ).not.toThrow();
    }
  });
});
