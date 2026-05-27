/** @jest-environment node */

// P0-13 (Audit 2026-05-26): requireAdminAccess + requireFounderAccess
// now run assertSessionNotRevoked. Stub the helper here so these tests
// keep their narrow scope — the watermark behaviour has its own tests.
jest.mock('@/lib/auth/session-revocation', () => ({
  assertSessionNotRevoked: jest.fn().mockResolvedValue(undefined),
  SessionRevokedError: class SessionRevokedError extends Error {},
}));

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

describe('requireFounderAccess', () => {
  const mockGetUser = jest.fn();

  const createClientMock = createSupabaseServerClient as jest.Mock;

  beforeEach(() => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
        // P0-13 (Audit 2026-05-26): getAuthenticatedUser also reads
        // auth.getSession to extract the access-token iat for
        // session-revocation enforcement. Tests don't care about the
        // value — provide a non-throwing default.
        getSession: jest
          .fn()
          .mockResolvedValue({ data: { session: null } }),
      },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.FOUNDER_EMAILS;
    delete process.env.FOUNDER_USER_IDS;
  });

  it('throws when no user is present', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    process.env.FOUNDER_EMAILS = 'founder@formaos.com.au';

    await expect(requireFounderAccess()).rejects.toThrow('Unauthorized');
  });

  it('throws when founder access is not configured', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
    });

    await expect(requireFounderAccess()).rejects.toThrow('Founder access not configured');
  });

  it('denies access when user is not in allow list', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
    });
    process.env.FOUNDER_EMAILS = 'founder@formaos.com.au';

    await expect(requireFounderAccess()).rejects.toThrow('Forbidden');
  });

  it('allows access when user matches allowed email', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'founder@formaos.com.au' } },
    });
    process.env.FOUNDER_EMAILS = 'founder@formaos.com.au';

    await expect(requireFounderAccess()).resolves.toEqual({
      user: { id: 'user-123', email: 'founder@formaos.com.au' },
    });
  });

  it('allows access when user matches allowed id', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-abc', email: 'user@example.com' } },
    });
    process.env.FOUNDER_USER_IDS = 'user-abc';

    await expect(requireFounderAccess()).resolves.toEqual({
      user: { id: 'user-abc', email: 'user@example.com' },
    });
  });
});
