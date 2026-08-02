/** @jest-environment node */
/**
 * Integration tests for /api/sso/saml/acs/[orgId] — IdP-initiated
 * SAML POST handler. v4-028: prior to this scaffold the four SAML
 * routes (login / acs / logout / metadata) had zero request-level
 * coverage; only the underlying lib/sso/saml unit tests existed.
 *
 * These tests exercise the route handler directly with mocked
 * dependencies (provisionJitUser, validateSamlResponse, supabase
 * admin client) so we cover:
 *   - missing SAMLResponse → 400
 *   - SSO disabled for org → 404
 *   - IdP-init success path → 302 redirect + identity event logged
 *   - validation failure → 302 redirect to signin with error
 *   - JIT provisioning fires when jitProvisioningEnabled
 *
 * Live-Supabase round-trip tests live separately under
 * RUN_INTEGRATION_TESTS=1; these are pure unit-on-route mocks.
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/sso/org-sso', () => ({ getOrgSsoConfig: jest.fn() }));
jest.mock('@/lib/sso/saml', () => ({
  validateSamlResponse: jest.fn(),
  buildServiceProviderUrls: jest.fn(() => ({
    appBase: 'https://app.formaos.com.au',
    metadataUrl: 'https://app.formaos.com.au/api/sso/saml/metadata/org-1',
  })),
}));
jest.mock('@/lib/sso/jit-provisioning', () => ({
  provisionJitUser: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => {
  const generateLink = jest.fn();
  // Audit 2026-08-02: the route now resolves the asserted email to an
  // org_members row before minting a session, so the admin client needs a
  // query-builder stub. Each builder is thenable and resolves with whatever
  // __tableData holds for that table.
  const tableData: Record<string, { data: unknown; error: unknown }> = {};
  function builder(table: string) {
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'ilike', 'eq', 'in', 'limit', 'order']) {
      chain[method] = () => chain;
    }
    chain.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(tableData[table] ?? { data: [], error: null }).then(resolve);
    return chain;
  }
  const client = { auth: { admin: { generateLink } }, from: (t: string) => builder(t) };
  return {
    createSupabaseAdminClient: () => client,
    __generateLink: generateLink,
    __tableData: tableData,
  };
});
jest.mock('@/lib/identity/audit', () => ({
  logIdentityEvent: jest.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/sso/saml/acs/[orgId]/route';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { validateSamlResponse } from '@/lib/sso/saml';
import { provisionJitUser } from '@/lib/sso/jit-provisioning';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';

const mockGetOrgSsoConfig = getOrgSsoConfig as jest.Mock;
const mockValidateSamlResponse = validateSamlResponse as jest.Mock;
const mockProvisionJitUser = provisionJitUser as jest.Mock;
const mockLogIdentityEvent = logIdentityEvent as jest.Mock;
const mockGenerateLink = (
  jest.requireMock('@/lib/supabase/admin') as { __generateLink: jest.Mock }
).__generateLink;
void createSupabaseAdminClient;

function makeRequest(samlResponse: string | null, relayState = '/app/dashboard') {
  const form = new FormData();
  if (samlResponse !== null) form.set('SAMLResponse', samlResponse);
  form.set('RelayState', relayState);
  return new Request('https://app.formaos.com.au/api/sso/saml/acs/org-1', {
    method: 'POST',
    body: form,
  });
}

const validResponse = 'a'.repeat(100);

const mockTableData = (
  jest.requireMock('@/lib/supabase/admin') as {
    __tableData: Record<string, { data: unknown; error: unknown }>;
  }
).__tableData;

beforeEach(() => {
  jest.clearAllMocks();
  // Audit 2026-08-02: default to the asserted user genuinely being a member of
  // org-1, so the pre-existing happy-path tests still describe a legitimate
  // login. The rejection path has its own test below.
  mockTableData.user_profiles = { data: [{ user_id: 'user-1' }], error: null };
  mockTableData.org_members = { data: [{ user_id: 'user-1' }], error: null };
  // v4-031: the ACS route now defensively refuses IdP-initiated
  // assertions (those without an InResponseTo attribute matching a
  // cached request id) unless the org has explicitly set
  // directorySyncConfig.allow_idp_initiated. Tests that exercise the
  // legacy IdP-init path must opt in via the config; the explicit
  // refusal path has its own test below.
  mockGetOrgSsoConfig.mockResolvedValue({
    enabled: true,
    idpEntityId: 'https://idp.example.com',
    allowedDomains: ['example.com'],
    jitProvisioningEnabled: false,
    jitDefaultRole: 'member',
    directorySyncConfig: { allow_idp_initiated: true },
  });
  mockValidateSamlResponse.mockResolvedValue({
    profile: { issuer: 'https://idp.example.com', email: 'user@example.com' },
    email: 'user@example.com',
    displayName: 'User',
    groups: [],
    audience: 'sp-audience',
  });
  mockGenerateLink.mockResolvedValue({
    data: {
      properties: {
        action_link: 'https://supabase.example/magic?token=abc',
      },
    },
    error: null,
  });
});

describe('POST /api/sso/saml/acs/[orgId]', () => {
  it('returns 404 when SSO not enabled for the org', async () => {
    mockGetOrgSsoConfig.mockResolvedValueOnce({ enabled: false });
    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 when SAMLResponse is missing', async () => {
    const res = await POST(makeRequest(null), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when SAMLResponse is too short to be valid', async () => {
    const res = await POST(makeRequest('short'), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(400);
  });

  it('redirects to magic link on successful IdP-init validation', async () => {
    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('supabase.example/magic');
    expect(mockLogIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'sso.login',
        result: 'success',
      }),
    );
  });

  it('fires JIT provisioning when jitProvisioningEnabled', async () => {
    mockGetOrgSsoConfig.mockResolvedValueOnce({
      enabled: true,
      idpEntityId: 'https://idp.example.com',
      allowedDomains: ['example.com'],
      jitProvisioningEnabled: true,
      jitDefaultRole: 'member',
      directorySyncConfig: { allow_idp_initiated: true },
    });
    await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(mockProvisionJitUser).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-1',
        allowedDomains: ['example.com'],
        defaultRole: 'member',
      }),
    );
  });

  it('refuses IdP-initiated assertions when allow_idp_initiated is not set', async () => {
    // v4-031: defence-in-depth gate. node-saml already rejects
    // genuine IdP-init flows via validateInResponseTo:'always' in
    // production, but this explicit check guards against future
    // config drift and gives an auditable reject in this case.
    mockGetOrgSsoConfig.mockResolvedValueOnce({
      enabled: true,
      idpEntityId: 'https://idp.example.com',
      allowedDomains: ['example.com'],
      jitProvisioningEnabled: false,
      jitDefaultRole: 'member',
      // No directorySyncConfig.allow_idp_initiated → must refuse.
    });
    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location') ?? '').toContain('sso_failed');
    expect(mockLogIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'sso.login',
        result: 'failure',
      }),
    );
  });

  // Audit 2026-08-02 — the assertion must be bound to THIS organisation.
  // Every trust anchor in validateSamlResponse is supplied by the org's own
  // admin (the signing certificate and idpEntityId come from idp_metadata_xml
  // they upload, and isAllowedDomain returns true on an empty list), and
  // nothing verifies they control the asserted domain. Without this check an
  // admin of any tenant could sign an assertion naming a victim on another
  // tenant and receive a magic link that logs them in as that user.
  it('refuses to mint a session for an email that is not a member of the org', async () => {
    mockTableData.org_members = { data: [], error: null };

    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });

    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('error=sso_failed');
    expect(mockLogIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'sso.login', result: 'failure' }),
    );
  });

  it('refuses when the asserted email matches no known account', async () => {
    mockTableData.user_profiles = { data: [], error: null };

    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });

    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('error=sso_failed');
  });

  it('permits SP-initiated assertions even when allow_idp_initiated is off', async () => {
    mockGetOrgSsoConfig.mockResolvedValueOnce({
      enabled: true,
      idpEntityId: 'https://idp.example.com',
      allowedDomains: ['example.com'],
      jitProvisioningEnabled: false,
      jitDefaultRole: 'member',
      // No allow_idp_initiated, but profile carries inResponseTo →
      // genuine SP-init flow; route accepts it.
    });
    mockValidateSamlResponse.mockResolvedValueOnce({
      profile: {
        issuer: 'https://idp.example.com',
        email: 'user@example.com',
        inResponseTo: 'req_abc123',
      },
      email: 'user@example.com',
      displayName: 'User',
      groups: [],
      audience: 'sp-audience',
    });
    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('supabase.example/magic');
  });

  it('redirects to signin with error on validation failure', async () => {
    mockValidateSamlResponse.mockRejectedValueOnce(
      new Error('Issuer does not match'),
    );
    const res = await POST(makeRequest(validResponse), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });
    expect(res.status).toBe(307);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toContain('/auth/signin');
    expect(loc).toContain('sso_failed');
    expect(mockLogIdentityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'sso.login',
        result: 'failure',
      }),
    );
  });
});
