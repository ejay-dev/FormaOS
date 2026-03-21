/**
 * @jest-environment node
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

let randomBytesMock: jest.Mock;
let mockClient: ReturnType<typeof mockSupabase>['client'];

jest.mock('crypto', () => ({
  randomBytes: jest.fn((size: number) => Buffer.alloc(size, 'a')),
}));

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => mockClient),
}));

import { DEFAULT_INVITATION_EXPIRY_MS, createInvitation } from '@/lib/invitations/create-invitation';
import { randomBytes } from 'crypto';

describe('createInvitation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-21T00:00:00.000Z'));
    randomBytesMock = randomBytes as jest.Mock;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a lowercased pending invitation with the default expiry', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'team_invitations' && operation.expects === 'maybeSingle') {
          return { data: null, error: null };
        }

        if (operation.table === 'team_invitations' && operation.action === 'insert') {
          return {
            data: {
              id: 'invite-1',
              email: 'person@example.com',
              organizations: { name: 'FormaOS' },
            },
            error: null,
          };
        }

        return { data: null, error: null };
      },
    });
    mockClient = supabase.client;

    const result = await createInvitation({
      organizationId: 'org-1',
      email: 'Person@Example.com',
      role: 'member',
      invitedBy: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.expiresAt).toBe(
      new Date(Date.now() + DEFAULT_INVITATION_EXPIRY_MS).toISOString(),
    );

    const insert = supabase.operations.find(
      (operation) => operation.table === 'team_invitations' && operation.action === 'insert',
    );
    expect(insert?.values).toEqual(
      expect.objectContaining({
        email: 'person@example.com',
        role: 'member',
        status: 'pending',
      }),
    );
    expect(randomBytesMock).toHaveBeenCalledWith(32);
  });

  it('revokes an existing pending invitation before creating a new one', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'team_invitations' && operation.expects === 'maybeSingle') {
          return { data: { id: 'existing-invite' }, error: null };
        }

        if (operation.table === 'team_invitations' && operation.action === 'update') {
          return { data: null, error: null };
        }

        if (operation.table === 'team_invitations' && operation.action === 'insert') {
          return { data: { id: 'invite-2' }, error: null };
        }

        return { data: null, error: null };
      },
    });
    mockClient = supabase.client;

    await createInvitation({
      organizationId: 'org-1',
      email: 'person@example.com',
      role: 'viewer',
      invitedBy: 'user-1',
      expiresInMs: 60_000,
    });

    const update = supabase.operations.find(
      (operation) => operation.table === 'team_invitations' && operation.action === 'update',
    );
    expect(update?.values).toEqual(
      expect.objectContaining({
        status: 'revoked',
      }),
    );
  });

  it('returns a structured failure when the invitation insert fails', async () => {
    const supabase = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'team_invitations' && operation.expects === 'maybeSingle') {
          return { data: null, error: null };
        }

        if (operation.table === 'team_invitations' && operation.action === 'insert') {
          return { data: null, error: { message: 'insert failed' } };
        }

        return { data: null, error: null };
      },
    });
    mockClient = supabase.client;
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await createInvitation({
      organizationId: 'org-1',
      email: 'person@example.com',
      role: 'admin',
      invitedBy: 'user-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({ message: 'insert failed' });
  });
});
