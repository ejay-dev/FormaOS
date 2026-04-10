/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/sso/saml', () => ({
  getSamlEmail: jest.fn(),
  getSamlDisplayName: jest.fn(),
  getSamlGroups: jest.fn(),
  isAllowedDomain: jest.fn(),
}));

import { provisionJitUser } from '@/lib/sso/jit-provisioning';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getSamlEmail,
  getSamlDisplayName,
  getSamlGroups,
  isAllowedDomain,
} from '@/lib/sso/saml';
import { logIdentityEvent } from '@/lib/identity/audit';

function makeAdmin(overrides: Record<string, any> = {}) {
  const authAdmin = {
    listUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
    createUser: jest
      .fn()
      .mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    ...(overrides.auth ?? {}),
  };
  return {
    auth: { admin: authAdmin },
    from:
      overrides.from ??
      jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
  };
}

describe('lib/sso/jit-provisioning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(makeAdmin());
  });

  it('throws when SAML profile has no email', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue(null);
    await expect(
      provisionJitUser({
        orgId: 'org1',
        profile: {} as any,
        allowedDomains: ['example.com'],
        defaultRole: 'member',
      }),
    ).rejects.toThrow('email');
  });

  it('throws when email domain not allowed', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('user@evil.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(false);
    await expect(
      provisionJitUser({
        orgId: 'org1',
        profile: {} as any,
        allowedDomains: ['example.com'],
        defaultRole: 'member',
      }),
    ).rejects.toThrow('domain');
  });

  it('creates a new user when none exists', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('new@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('New User');
    (getSamlGroups as jest.Mock).mockReturnValue([]);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });

    expect(result.created).toBe(true);
    expect(result.email).toBe('new@example.com');
    expect(result.role).toBe('member');
  });

  it('uses existing user when found', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('existing@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('Existing');
    (getSamlGroups as jest.Mock).mockReturnValue([]);

    const admin = makeAdmin({
      auth: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: [{ id: 'u99', email: 'existing@example.com' }] },
        }),
      },
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });

    expect(result.created).toBe(false);
    expect(result.userId).toBe('u99');
  });

  it('maps admin group to admin role', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('admin@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('Admin');
    (getSamlGroups as jest.Mock).mockReturnValue(['Company_Admin']);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });

    expect(result.role).toBe('admin');
  });

  it('maps owner group to owner role', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('o@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('O');
    (getSamlGroups as jest.Mock).mockReturnValue(['team-owner']);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });
    expect(result.role).toBe('owner');
  });

  it('maps auditor group to auditor role', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('a@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('A');
    (getSamlGroups as jest.Mock).mockReturnValue(['Auditor_External']);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });
    expect(result.role).toBe('auditor');
  });

  it('maps viewer/read group to viewer role', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('v@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('V');
    (getSamlGroups as jest.Mock).mockReturnValue(['read-only']);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    const result = await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
    });
    expect(result.role).toBe('viewer');
  });

  it('throws on membership upsert error', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('fail@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('Fail');
    (getSamlGroups as jest.Mock).mockReturnValue([]);

    const admin = makeAdmin();
    admin.from = jest.fn().mockReturnValue({
      upsert: jest
        .fn()
        .mockResolvedValue({ error: { message: 'unique violation' } }),
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    await expect(
      provisionJitUser({
        orgId: 'org1',
        profile: {} as any,
        allowedDomains: ['example.com'],
        defaultRole: 'member',
      }),
    ).rejects.toThrow('unique violation');
  });

  it('throws on user create error', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('err@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('Err');
    (getSamlGroups as jest.Mock).mockReturnValue([]);

    const admin = makeAdmin({
      auth: {
        createUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'email already exists' },
        }),
      },
    });
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    await expect(
      provisionJitUser({
        orgId: 'org1',
        profile: {} as any,
        allowedDomains: ['example.com'],
        defaultRole: 'member',
      }),
    ).rejects.toThrow('email already exists');
  });

  it('logs identity event', async () => {
    (getSamlEmail as jest.Mock).mockReturnValue('log@example.com');
    (isAllowedDomain as jest.Mock).mockReturnValue(true);
    (getSamlDisplayName as jest.Mock).mockReturnValue('Log');
    (getSamlGroups as jest.Mock).mockReturnValue([]);

    const admin = makeAdmin();
    (createSupabaseAdminClient as jest.Mock).mockReturnValue(admin);

    await provisionJitUser({
      orgId: 'org1',
      profile: {} as any,
      allowedDomains: ['example.com'],
      defaultRole: 'member',
      actorLabel: 'TestActor',
    });

    expect(logIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'jit.user.provisioned',
        actorLabel: 'TestActor',
      }),
    );
  });
});
