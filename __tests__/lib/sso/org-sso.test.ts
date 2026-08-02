/**
 * Tests for lib/sso/org-sso.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));
jest.mock('@/lib/sso/saml', () => ({
  parseIdpMetadataXml: jest.fn().mockReturnValue({
    entityId: 'https://idp.example.com',
    ssoUrl: 'https://idp.example.com/sso',
    certificate: 'CERT',
    logoutUrl: 'https://idp.example.com/logout',
  }),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'contains',
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

const { createSupabaseServerClient } = require('@/lib/supabase/server');
const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  getOrgSsoConfig,
  upsertOrgSsoConfig,
  discoverOrgSsoByEmail,
} from '@/lib/sso/org-sso';

beforeEach(() => jest.clearAllMocks());

describe('getOrgSsoConfig', () => {
  it('returns null when no SSO config', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });
    expect(await getOrgSsoConfig('org-1')).toBeNull();
  });

  it('returns null on error', async () => {
    const builder = createBuilder({ data: null, error: { message: 'fail' } });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });
    expect(await getOrgSsoConfig('org-1')).toBeNull();
  });

  it('treats missing organization_sso as optional without noisy logging', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const builder = createBuilder({
      data: null,
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.organization_sso'",
      },
    });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    expect(await getOrgSsoConfig('org-1')).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('returns normalized SSO config', async () => {
    const row = {
      enabled: true,
      enforce_sso: true,
      idp_metadata_xml: '<xml/>',
      idp_entity_id: 'https://idp.example.com',
      sso_url: 'https://idp.example.com/sso',
      certificate: 'CERT',
      logout_url: 'https://idp.example.com/logout',
      allowed_domains: [' Example.com ', 'test.com'],
      jit_provisioning_enabled: true,
      jit_default_role: 'member',
      directory_sync_enabled: false,
      directory_sync_provider: null,
      directory_sync_interval_minutes: null,
      directory_sync_config: null,
      updated_at: '2024-01-01',
    };
    const builder = createBuilder({ data: row, error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const config = await getOrgSsoConfig('org-1');
    expect(config).not.toBeNull();
    expect(config!.enabled).toBe(true);
    expect(config!.allowedDomains).toEqual(['example.com', 'test.com']);
    expect(config!.directorySyncIntervalMinutes).toBe(60);
    expect(config!.directorySyncConfig).toEqual({});
  });

  it('handles falsy directory_sync_config', async () => {
    const row = {
      enabled: false,
      enforce_sso: false,
      idp_metadata_xml: null,
      idp_entity_id: null,
      sso_url: null,
      certificate: null,
      logout_url: null,
      allowed_domains: null,
      jit_provisioning_enabled: null,
      jit_default_role: null,
      directory_sync_enabled: null,
      directory_sync_provider: null,
      directory_sync_interval_minutes: null,
      directory_sync_config: 'not-object',
      updated_at: null,
    };
    const builder = createBuilder({ data: row, error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const config = await getOrgSsoConfig('org-1');
    expect(config!.directorySyncConfig).toEqual({});
  });
});

describe('upsertOrgSsoConfig', () => {
  it('upserts SSO config with parsed metadata', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const result = await upsertOrgSsoConfig({
      orgId: 'org-1',
      enabled: true,
      enforceSso: true,
      allowedDomains: ['example.com'],
      idpMetadataXml: '<xml/>',
    });
    expect(result.ok).toBe(true);
  });

  it('upserts without idp metadata xml', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const result = await upsertOrgSsoConfig({
      orgId: 'org-1',
      enabled: false,
      enforceSso: false,
      allowedDomains: [],
      idpMetadataXml: null,
    });
    expect(result.ok).toBe(true);
  });

  it('returns error on upsert failure', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'conflict' },
    });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const result = await upsertOrgSsoConfig({
      orgId: 'org-1',
      enabled: true,
      enforceSso: false,
      allowedDomains: [],
      idpMetadataXml: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('conflict');
  });

  it('returns schema unavailable when organization_sso is missing', async () => {
    const builder = createBuilder({
      data: null,
      error: {
        code: '42P01',
        message: 'relation "public.organization_sso" does not exist',
      },
    });
    createSupabaseServerClient.mockResolvedValue({
      from: jest.fn(() => builder),
    });

    const result = await upsertOrgSsoConfig({
      orgId: 'org-1',
      enabled: true,
      enforceSso: false,
      allowedDomains: [],
      idpMetadataXml: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('sso_schema_unavailable');
  });
});

describe('discoverOrgSsoByEmail', () => {
  it('returns error for invalid email', async () => {
    const result = await discoverOrgSsoByEmail('notanemail');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('invalid_email');
  });

  it('returns not_found when no SSO config matches domain', async () => {
    const builder = createBuilder({ data: null, error: null });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await discoverOrgSsoByEmail('user@example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('not_found');
  });

  it('returns error on query failure', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'db error' },
    });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await discoverOrgSsoByEmail('user@example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('db error');
  });

  it('treats missing organization_sso as not found during discovery', async () => {
    const builder = createBuilder({
      data: null,
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.organization_sso'",
      },
    });
    createSupabaseAdminClient.mockReturnValue({ from: jest.fn(() => builder) });

    const result = await discoverOrgSsoByEmail('user@example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('not_found');
  });

  it('returns org with enforce SSO when enterprise active', async () => {
    const ssoData = {
      organization_id: 'org-1',
      enabled: true,
      enforce_sso: true,
      allowed_domains: ['example.com'],
    };
    const subData = { plan_key: 'enterprise', status: 'active' };

    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: ssoData, error: null });
        return createBuilder({ data: subData, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await discoverOrgSsoByEmail('user@example.com');
    expect(result.ok).toBe(true);
    expect(result.orgId).toBe('org-1');
    expect(result.enforceSso).toBe(true);
  });

  it('does not enforce SSO for non-enterprise', async () => {
    const ssoData = {
      organization_id: 'org-2',
      enabled: true,
      enforce_sso: true,
      allowed_domains: ['corp.com'],
    };
    const subData = { plan_key: 'pro', status: 'active' };

    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: ssoData, error: null });
        return createBuilder({ data: subData, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await discoverOrgSsoByEmail('user@corp.com');
    expect(result.ok).toBe(true);
    expect(result.enforceSso).toBe(false);
  });

  // Policy (lib/sso/org-sso.ts:192): a trialing subscription counts as
  // active, so a trialing enterprise org CAN enforce SSO. The test name
  // previously claimed the opposite of its own assertion.
  it('enforces SSO for a trialing enterprise subscription', async () => {
    const ssoData = {
      organization_id: 'org-3',
      enabled: true,
      enforce_sso: true,
      allowed_domains: ['trial.com'],
    };
    const subData = { plan_key: 'enterprise', status: 'trialing' };

    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: ssoData, error: null });
        return createBuilder({ data: subData, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await discoverOrgSsoByEmail('user@trial.com');
    expect(result.ok).toBe(true);
    expect(result.orgId).toBe('org-3');
    expect(result.enforceSso).toBe(true);
  });

  it('does not enforce SSO for a lapsed enterprise subscription', async () => {
    const ssoData = {
      organization_id: 'org-4',
      enabled: true,
      enforce_sso: true,
      allowed_domains: ['lapsed.com'],
    };
    const subData = { plan_key: 'enterprise', status: 'past_due' };

    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: ssoData, error: null });
        return createBuilder({ data: subData, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await discoverOrgSsoByEmail('user@lapsed.com');
    expect(result.ok).toBe(true);
    // Config is still returned, but enforcement is off without an
    // active/trialing subscription — otherwise a lapsed org could lock
    // every member out of password login.
    expect(result.enabled).toBe(true);
    expect(result.enforceSso).toBe(false);
  });

  it('does not enforce SSO when the org has no subscription row', async () => {
    const ssoData = {
      organization_id: 'org-5',
      enabled: true,
      enforce_sso: true,
      allowed_domains: ['nosub.com'],
    };

    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ data: ssoData, error: null });
        return createBuilder({ data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);

    const result = await discoverOrgSsoByEmail('user@nosub.com');
    expect(result.ok).toBe(true);
    expect(result.enforceSso).toBe(false);
  });
});
