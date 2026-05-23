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
  const client = { auth: { admin: { generateLink } } };
  return {
    createSupabaseAdminClient: () => client,
    __generateLink: generateLink,
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

beforeEach(() => {
  jest.clearAllMocks();
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
