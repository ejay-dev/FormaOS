/**
 * @jest-environment node
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

let fetchMock: jest.Mock;

jest.mock('@/lib/observability/structured-logger', () => ({
  authLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

import {
  exchangeOAuthCode,
  isPkceExchangeError,
  normalizeFrameworks,
  resolveFrameworksForOrganization,
  selectPrimaryMembership,
} from '@/lib/auth/callback';

describe('lib/auth/callback helpers', () => {
  it('normalizes frameworks by trimming, filtering blanks, and de-duplicating', () => {
    expect(
      normalizeFrameworks([' iso27001 ', 'soc2', '', null, 'soc2'] as unknown[]),
    ).toEqual(['iso27001', 'soc2']);
    expect(normalizeFrameworks(null)).toEqual([]);
  });

  it('selects the highest-weight primary membership and breaks ties by newest created_at', () => {
    expect(
      selectPrimaryMembership([
        {
          organization_id: 'member-org',
          role: 'member',
          created_at: '2026-03-19T00:00:00.000Z',
        },
        {
          organization_id: 'admin-org',
          role: 'admin',
          created_at: '2026-03-18T00:00:00.000Z',
        },
        {
          organization_id: 'owner-org',
          role: 'owner',
          created_at: '2026-03-17T00:00:00.000Z',
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        organization_id: 'owner-org',
        role: 'owner',
      }),
    );

    expect(
      selectPrimaryMembership([
        {
          organization_id: 'older-admin',
          role: 'admin',
          created_at: '2026-03-19T00:00:00.000Z',
        },
        {
          organization_id: 'newer-admin',
          role: 'admin',
          created_at: '2026-03-20T00:00:00.000Z',
        },
      ]),
    ).toEqual(
      expect.objectContaining({
        organization_id: 'newer-admin',
      }),
    );
  });

  it('detects PKCE failures from both code and message shapes', () => {
    expect(isPkceExchangeError({ code: 'pkce_verifier_invalid' })).toBe(true);
    expect(isPkceExchangeError({ message: 'missing code verifier cookie' })).toBe(
      true,
    );
    expect(isPkceExchangeError({ message: 'network timeout' })).toBe(false);
  });

  it('repairs organization frameworks from org_frameworks rows when the main column is empty', async () => {
    const admin = mockSupabase({
      resolver: (operation) => {
        if (operation.table === 'org_frameworks') {
          return {
            data: [
              { framework_slug: 'iso27001' },
              { framework_slug: 'soc2' },
            ],
            error: null,
          };
        }

        if (operation.table === 'organizations' && operation.action === 'update') {
          return { data: null, error: null };
        }

        return { data: null, error: null };
      },
    }).client;

    const result = await resolveFrameworksForOrganization(
      admin as never,
      'org-1',
      null,
    );

    expect(result).toEqual({
      frameworks: ['iso27001', 'soc2'],
      repairedFromOrgFrameworks: true,
    });
  });

  it('returns the direct frameworks without querying the database when the org already has them', async () => {
    const admin = { from: jest.fn() };

    const result = await resolveFrameworksForOrganization(
      admin as never,
      'org-1',
      ['iso27001', 'soc2', 'soc2'],
    );

    expect(result).toEqual({
      frameworks: ['iso27001', 'soc2'],
      repairedFromOrgFrameworks: false,
    });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('uses the native exchange result when there is no PKCE error', async () => {
    const exchangeData = {
      user: { id: 'user-1', email: 'user@example.com' },
      session: { access_token: 'a', refresh_token: 'r' },
    };
    const supabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: exchangeData,
          error: null,
        }),
        setSession: jest.fn(),
      },
    };

    await expect(
      exchangeOAuthCode({
        appBase: 'https://app.formaos.com.au',
        code: 'auth-code',
        cookieDomain: 'formaos.com.au',
        cookieNames: [],
        cookieSnapshot: [],
        hasPkceVerifier: false,
        requestHost: 'app.formaos.com.au',
        serviceRoleKey: 'service-role',
        supabase: supabase as never,
        supabaseAnonKey: 'anon-key',
        supabaseUrl: 'https://project.supabase.co',
      }),
    ).resolves.toEqual({
      exchangeData,
      exchangeError: null,
    });
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });

  it('falls back to the verifier cookie when the native exchange reports a PKCE error', async () => {
    const supabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { code: 'pkce_verifier_missing', message: 'missing verifier' },
        }),
        setSession: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1', email: 'user@example.com' },
            session: { access_token: 'access', refresh_token: 'refresh' },
          },
          error: null,
        }),
      },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access',
        refresh_token: 'refresh',
      }),
    });

    const result = await exchangeOAuthCode({
      appBase: 'https://app.formaos.com.au',
      code: 'auth-code',
      cookieDomain: 'formaos.com.au',
      cookieNames: ['sb-code-verifier'],
      cookieSnapshot: [{ name: 'sb-code-verifier', value: 'verifier-123' }],
      hasPkceVerifier: true,
      requestHost: 'app.formaos.com.au',
      serviceRoleKey: 'service-role',
      supabase: supabase as never,
      supabaseAnonKey: 'anon-key',
      supabaseUrl: 'https://project.supabase.co',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=pkce',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result.exchangeError).toBeNull();
    expect(result.exchangeData?.user?.id).toBe('user-1');
  });
});
