/** @jest-environment node */

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
