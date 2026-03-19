/** @jest-environment node */

/**
 * Unit tests for lib/security/csrf.ts — CSRF origin validation
 */

// Mock NextResponse before importing the module under test
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

import { validateCsrfOrigin } from '@/lib/security/csrf';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  method: string,
  url: string = 'https://app.example.com/api/data',
  headers: Record<string, string> = {},
): Request {
  return {
    method,
    url,
    headers: new Headers(headers),
  } as unknown as Request;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateCsrfOrigin', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // --- Safe methods bypass CSRF ---

  it('allows GET requests without any origin header', () => {
    const result = validateCsrfOrigin(makeRequest('GET'));
    expect(result).toBeNull();
  });

  it('allows HEAD requests without any origin header', () => {
    const result = validateCsrfOrigin(makeRequest('HEAD'));
    expect(result).toBeNull();
  });

  it('allows OPTIONS requests without any origin header', () => {
    const result = validateCsrfOrigin(makeRequest('OPTIONS'));
    expect(result).toBeNull();
  });

  // --- Missing origin on state-changing methods ---

  it('blocks POST with no Origin or Referer header', () => {
    const result = validateCsrfOrigin(makeRequest('POST'));
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
    expect((result as any).body).toEqual(
      expect.objectContaining({ error: 'Forbidden: missing origin' }),
    );
  });

  it('blocks DELETE with no Origin or Referer header', () => {
    const result = validateCsrfOrigin(makeRequest('DELETE'));
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
  });

  it('blocks PUT with no Origin or Referer header', () => {
    const result = validateCsrfOrigin(makeRequest('PUT'));
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
  });

  // --- Trusted origin ---

  it('allows POST from a trusted Origin header', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        origin: 'https://app.example.com',
      }),
    );
    expect(result).toBeNull();
  });

  it('allows POST when Referer header matches a trusted origin', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        referer: 'https://app.example.com/some/page',
      }),
    );
    expect(result).toBeNull();
  });

  // --- Untrusted origin ---

  it('blocks POST from an untrusted Origin', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        origin: 'https://evil.com',
      }),
    );
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
    expect((result as any).body).toEqual(
      expect.objectContaining({ error: 'Forbidden: untrusted origin' }),
    );
  });

  it('blocks POST from an untrusted Referer', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        referer: 'https://evil.com/phishing-page',
      }),
    );
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
  });

  // --- Case insensitivity ---

  it('handles Origin header case-insensitively', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        origin: 'HTTPS://APP.EXAMPLE.COM',
      }),
    );
    expect(result).toBeNull();
  });

  // --- Malformed referer ---

  it('blocks POST with a malformed Referer header (treated as missing)', () => {
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        referer: 'not-a-valid-url',
      }),
    );
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
  });

  // --- VERCEL_URL env var ---

  it('trusts VERCEL_URL when it is set', () => {
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        origin: 'https://my-app-abc123.vercel.app',
      }),
    );
    expect(result).toBeNull();
  });

  // --- Development mode localhost ---

  it('trusts localhost:3000 in development', () => {
    process.env.NODE_ENV = 'development';
    const result = validateCsrfOrigin(
      makeRequest('POST', 'http://localhost:3000/api/data', {
        origin: 'http://localhost:3000',
      }),
    );
    expect(result).toBeNull();
  });

  it('does not trust localhost:3000 in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_APP_URL; // remove all trusted origins
    const result = validateCsrfOrigin(
      makeRequest('POST', 'https://app.example.com/api/data', {
        origin: 'http://localhost:3000',
      }),
    );
    expect(result).not.toBeNull();
    expect((result as any).status).toBe(403);
  });
});
