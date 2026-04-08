/**
 * Branch-coverage tests for lib/security/session-security.ts
 * Targets uncovered branches in createTrackedSession, validateSession,
 * revokeAllUserSessions, getUserActiveSessions, logSecurityEvent
 */

// Polyfill crypto for jsdom
import { webcrypto } from 'crypto';
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

jest.mock('server-only', () => ({}));

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
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let adminBuilder: any;
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => adminBuilder),
  })),
}));

const mockDispatch = jest.fn();
jest.mock('@/lib/security/event-logger', () => ({
  dispatchSecurityEventEnhanced: (...a: any[]) => mockDispatch(...a),
}));

import {
  createTrackedSession,
  validateSession,
  revokeSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  getUserActiveSessions,
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';

describe('createTrackedSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a session and returns id + expiresAt', async () => {
    adminBuilder = createBuilder({ data: { id: 'sess-1' }, error: null });
    const result = await createTrackedSession({
      userId: 'u1',
      sessionToken: 'token-1',
      ipAddress: '1.2.3.4',
      userAgent: 'Chrome',
    });
    expect(result.sessionId).toBe('sess-1');
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('throws when insert fails', async () => {
    adminBuilder = createBuilder({
      data: null,
      error: { message: 'insert fail' },
    });
    await expect(
      createTrackedSession({
        userId: 'u1',
        sessionToken: 'token-1',
        ipAddress: '1.2.3.4',
        userAgent: 'Chrome',
      }),
    ).rejects.toThrow('Failed to create session');
  });
});

describe('validateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockImplementation(() => {});
  });

  it('returns invalid when session not found', async () => {
    adminBuilder = createBuilder({ data: null, error: null });
    const result = await validateSession('bad-token', '1.2.3.4');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('returns invalid when query errors', async () => {
    adminBuilder = createBuilder({ data: null, error: { message: 'DB err' } });
    const result = await validateSession('bad-token', '1.2.3.4');
    expect(result.valid).toBe(false);
  });

  it('returns invalid when session expired', async () => {
    const expired = new Date(Date.now() - 86400000).toISOString();
    adminBuilder = createBuilder({
      data: {
        id: 's1',
        user_id: 'u1',
        expires_at: expired,
        last_active_at: expired,
        device_fingerprint: null,
      },
      error: null,
    });
    const result = await validateSession('token', '1.2.3.4');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('returns valid for active session', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const now = new Date().toISOString();
    adminBuilder = createBuilder({
      data: {
        id: 's1',
        user_id: 'u1',
        expires_at: future,
        last_active_at: now,
        device_fingerprint: null,
      },
      error: null,
    });
    const result = await validateSession('token', '1.2.3.4');
    expect(result.valid).toBe(true);
    expect(result.session).toBeDefined();
  });

  it('logs fingerprint mismatch but still validates', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const now = new Date().toISOString();
    adminBuilder = createBuilder({
      data: {
        id: 's1',
        user_id: 'u1',
        expires_at: future,
        last_active_at: now,
        device_fingerprint: 'abc12345',
      },
      error: null,
    });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await validateSession('token', '1.2.3.4', 'different-fp');
    expect(result.valid).toBe(true);
    consoleSpy.mockRestore();
  });

  it('skips fingerprint check when no current fingerprint', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const now = new Date().toISOString();
    adminBuilder = createBuilder({
      data: {
        id: 's1',
        user_id: 'u1',
        expires_at: future,
        last_active_at: now,
        device_fingerprint: 'abc12345',
      },
      error: null,
    });
    const result = await validateSession('token', '1.2.3.4');
    expect(result.valid).toBe(true);
  });
});

describe('revokeSession', () => {
  it('updates session revoked_at', async () => {
    adminBuilder = createBuilder({ data: null, error: null });
    await revokeSession('sess-1');
    // No error thrown
  });
});

describe('revokeSessionByToken', () => {
  it('revokes by token hash', async () => {
    adminBuilder = createBuilder({ data: null, error: null });
    await revokeSessionByToken('some-token');
    // No error thrown
  });
});

describe('revokeAllUserSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns count of revoked sessions', async () => {
    adminBuilder = createBuilder({
      data: [{ id: '1' }, { id: '2' }],
      error: null,
    });
    const count = await revokeAllUserSessions('u1');
    expect(count).toBe(2);
  });

  it('throws when query fails', async () => {
    adminBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    await expect(revokeAllUserSessions('u1')).rejects.toThrow(
      'Failed to revoke',
    );
  });

  it('returns 0 when no sessions', async () => {
    adminBuilder = createBuilder({ data: [], error: null });
    const count = await revokeAllUserSessions('u1');
    expect(count).toBe(0);
  });
});

describe('getUserActiveSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mapped sessions', async () => {
    const now = new Date().toISOString();
    adminBuilder = createBuilder({
      data: [
        {
          id: 's1',
          ip_address: '1.2.3.4',
          user_agent: 'Chrome',
          last_active_at: now,
          created_at: now,
        },
      ],
      error: null,
    });
    const sessions = await getUserActiveSessions('u1');
    expect(sessions.length).toBe(1);
    expect(sessions[0].ipAddress).toBe('1.2.3.4');
  });

  it('returns empty on error', async () => {
    adminBuilder = createBuilder({ data: null, error: { message: 'fail' } });
    const sessions = await getUserActiveSessions('u1');
    expect(sessions).toEqual([]);
  });
});

describe('logSecurityEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminBuilder = createBuilder({ data: null, error: null });
  });

  it('maps session_fingerprint_mismatch event type', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.SESSION_FINGERPRINT_MISMATCH,
      userId: 'u1',
      ipAddress: '1.2.3.4',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fingerprint_mismatch',
        severity: 'high',
      }),
    );
  });

  it('maps suspicious_activity event type', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.SUSPICIOUS_ACTIVITY,
      userId: 'u1',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suspicious_api_pattern' }),
    );
  });

  it('maps password_reset_request event type', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.PASSWORD_RESET_REQUEST,
      userId: 'u1',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'token_anomaly' }),
    );
  });

  it('uses default severity for unknown event type', () => {
    logSecurityEvent({
      eventType: 'custom_unknown_event',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'medium' }),
    );
  });

  it('logs login_success with info severity', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.LOGIN_SUCCESS,
      userId: 'u1',
      metadata: { path: '/auth/login', method: 'POST', statusCode: 200 },
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        path: '/auth/login',
        method: 'POST',
        statusCode: 200,
      }),
    );
  });

  it('handles missing metadata path/method/statusCode', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.LOGOUT,
      metadata: {},
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: undefined,
        method: undefined,
        statusCode: undefined,
      }),
    );
  });

  it('handles no metadata at all', () => {
    logSecurityEvent({
      eventType: SecurityEventTypes.LOGIN_FAILURE,
    });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('catches errors silently', () => {
    mockDispatch.mockImplementation(() => {
      throw new Error('fail');
    });
    // Should not throw
    expect(() => logSecurityEvent({ eventType: 'test' })).not.toThrow();
  });
});
