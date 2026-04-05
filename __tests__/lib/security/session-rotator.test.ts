/**
 * Tests for lib/security/session-rotator.ts
 * All functions use createSupabaseServerClient which returns auth methods.
 */

const mockAuth = {
  getSession: jest.fn(),
  getUser: jest.fn(),
  refreshSession: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  __esModule: true,
  createSupabaseServerClient: jest.fn(() =>
    Promise.resolve({ auth: mockAuth }),
  ),
}));

import {
  rotateSession,
  validateSession,
  getSessionMetadata,
  needsRotation,
} from '@/lib/security/session-rotator';

beforeEach(() => {
  mockAuth.getSession.mockReset();
  mockAuth.getUser.mockReset();
  mockAuth.refreshSession.mockReset();
});

describe('rotateSession', () => {
  it('returns success with new session data', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'old-at',
          refresh_token: 'old-rt',
        },
      },
      error: null,
    });
    mockAuth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'new-at',
          refresh_token: 'new-rt',
          expires_in: 7200,
        },
      },
      error: null,
    });

    const result = await rotateSession();
    expect(result.success).toBe(true);
    expect(result.newSession?.accessToken).toBe('new-at');
    expect(result.newSession?.refreshToken).toBe('new-rt');
    expect(result.newSession?.expiresIn).toBe(7200);
  });

  it('returns error when no active session', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await rotateSession();
    expect(result.success).toBe(false);
    expect(result.error).toContain('No active session');
  });

  it('returns error when refresh fails', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: { access_token: 'at' } },
      error: null,
    });
    mockAuth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Refresh failed' },
    });

    const result = await rotateSession();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Refresh failed');
  });

  it('handles unexpected errors gracefully', async () => {
    mockAuth.getSession.mockRejectedValue(new Error('network'));

    const result = await rotateSession();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Internal error');
  });
});

describe('validateSession', () => {
  it('returns valid with userId', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const result = await validateSession();
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-123');
  });

  it('returns invalid when no user', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const result = await validateSession();
    expect(result.valid).toBe(false);
  });

  it('handles errors gracefully', async () => {
    mockAuth.getUser.mockRejectedValue(new Error('crash'));

    const result = await validateSession();
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Session validation failed');
  });
});

describe('getSessionMetadata', () => {
  it('returns metadata for active session', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
    mockAuth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u-1', email: 'test@test.com' },
          expires_at: futureTimestamp,
        },
      },
      error: null,
    });

    const meta = await getSessionMetadata();
    expect(meta).not.toBeNull();
    expect(meta?.userId).toBe('u-1');
    expect(meta?.email).toBe('test@test.com');
    expect(meta?.expiresAt).toBeInstanceOf(Date);
  });

  it('returns null when no session', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const meta = await getSessionMetadata();
    expect(meta).toBeNull();
  });

  it('returns null on error', async () => {
    mockAuth.getSession.mockRejectedValue(new Error('fail'));

    const meta = await getSessionMetadata();
    expect(meta).toBeNull();
  });
});

describe('needsRotation', () => {
  it('returns true when no session', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
    });

    expect(await needsRotation()).toBe(true);
  });

  it('returns true when expiry < 1 hour away', async () => {
    const soonExpiry = Math.floor(Date.now() / 1000) + 1800; // 30 min
    mockAuth.getSession.mockResolvedValue({
      data: { session: { expires_at: soonExpiry } },
    });

    expect(await needsRotation()).toBe(true);
  });

  it('returns false when expiry > 1 hour away', async () => {
    const farExpiry = Math.floor(Date.now() / 1000) + 7200; // 2 hours
    mockAuth.getSession.mockResolvedValue({
      data: { session: { expires_at: farExpiry } },
    });

    expect(await needsRotation()).toBe(false);
  });

  it('returns true on error', async () => {
    mockAuth.getSession.mockRejectedValue(new Error('fail'));

    expect(await needsRotation()).toBe(true);
  });
});
