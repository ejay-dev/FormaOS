/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockCreateServerClient = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

jest.mock('@/lib/supabase/cookie-domain', () => ({
  getCookieDomain: jest.fn(() => null),
}));

jest.mock('@/lib/utils/founder', () => ({
  isFounder: jest.fn(() => false),
}));

jest.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: jest.fn(() => 'https://example.supabase.co'),
  getSupabaseAnonKey: jest.fn(() => 'test-anon-key'),
}));

jest.mock('@/lib/env-validation', () => ({
  assertEnvVars: jest.fn(),
}));

import { proxy } from '@/proxy';

function buildAppRequest(): NextRequest {
  return new NextRequest('https://app.formaos.com.au/app', {
    headers: {
      cookie: 'sb-test-auth-token=dummy-token',
    },
  });
}

function extractScriptSrcDirective(csp: string): string {
  const directive = csp
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith('script-src '));

  return directive ?? '';
}

describe('proxy CSP header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'owner@test.formaos.local',
        },
      },
      error: null,
    });
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: (...args: unknown[]) => mockGetUser(...args),
      },
    });
    process.env.CSP_ALLOW_INLINE_SCRIPTS = 'false';
    process.env.CSP_ALLOW_EVAL_SCRIPTS = 'false';
  });

  test('applies nonce-based CSP and expected directives for app routes', async () => {
    const response = await proxy(buildAppRequest());
    const csp = response.headers.get('content-security-policy');

    expect(response.status).toBe(200);
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://*.sentry.io');
    expect(csp).toContain('https://*.posthog.com');
    expect(csp).toContain('https://js.stripe.com');
    expect(csp).toContain("frame-src 'self' https://js.stripe.com https://hooks.stripe.com");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");

    const scriptSrc = extractScriptSrcDirective(csp as string);
    expect(scriptSrc).toMatch(/'nonce-[^']+'/);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  test('generates a unique nonce per request', async () => {
    const responseA = await proxy(buildAppRequest());
    const responseB = await proxy(buildAppRequest());

    const cspA = responseA.headers.get('content-security-policy') ?? '';
    const cspB = responseB.headers.get('content-security-policy') ?? '';
    const nonceA = cspA.match(/'nonce-([^']+)'/)?.[1];
    const nonceB = cspB.match(/'nonce-([^']+)'/)?.[1];

    expect(nonceA).toBeTruthy();
    expect(nonceB).toBeTruthy();
    expect(nonceA).not.toBe(nonceB);
  });
});
