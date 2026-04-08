/**
 * Tests for lib/security/csrf.ts
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.formaos.com';
  process.env.NODE_ENV = 'production';
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_BRANCH_URL;
});

afterAll(() => {
  process.env = originalEnv;
});

import { validateCsrfOrigin } from '@/lib/security/csrf';

function makeRequest(method: string, headers: Record<string, string> = {}) {
  return {
    method,
    url: 'https://app.formaos.com/api/test',
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  } as unknown as Request;
}

describe('validateCsrfOrigin', () => {
  describe('safe methods', () => {
    it('allows GET requests without origin', () => {
      expect(validateCsrfOrigin(makeRequest('GET'))).toBeNull();
    });

    it('allows HEAD requests without origin', () => {
      expect(validateCsrfOrigin(makeRequest('HEAD'))).toBeNull();
    });

    it('allows OPTIONS requests without origin', () => {
      expect(validateCsrfOrigin(makeRequest('OPTIONS'))).toBeNull();
    });
  });

  describe('state-changing methods', () => {
    it('blocks POST with no origin or referer', () => {
      const result = validateCsrfOrigin(makeRequest('POST'));
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it('blocks PUT with no origin or referer', () => {
      const result = validateCsrfOrigin(makeRequest('PUT'));
      expect(result).not.toBeNull();
    });

    it('blocks DELETE with no origin or referer', () => {
      const result = validateCsrfOrigin(makeRequest('DELETE'));
      expect(result).not.toBeNull();
    });

    it('blocks PATCH with no origin or referer', () => {
      const result = validateCsrfOrigin(makeRequest('PATCH'));
      expect(result).not.toBeNull();
    });

    it('allows POST with trusted origin', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { origin: 'https://app.formaos.com' }),
      );
      expect(result).toBeNull();
    });

    it('allows POST with trusted site URL origin', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { origin: 'https://www.formaos.com' }),
      );
      expect(result).toBeNull();
    });

    it('blocks POST with untrusted origin', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { origin: 'https://evil.com' }),
      );
      expect(result).not.toBeNull();
    });

    it('allows POST with trusted referer when no origin', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', {
          referer: 'https://app.formaos.com/dashboard',
        }),
      );
      expect(result).toBeNull();
    });

    it('blocks POST with untrusted referer', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { referer: 'https://evil.com/attack' }),
      );
      expect(result).not.toBeNull();
    });

    it('blocks POST with malformed referer', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { referer: 'not a url' }),
      );
      expect(result).not.toBeNull();
    });

    it('is case-insensitive for origin matching', () => {
      const result = validateCsrfOrigin(
        makeRequest('POST', { origin: 'HTTPS://APP.FORMAOS.COM' }),
      );
      expect(result).toBeNull();
    });
  });

  describe('Vercel URL support', () => {
    it('trusts VERCEL_URL when set', () => {
      process.env.VERCEL_URL = 'my-app-git-main.vercel.app';

      // Re-import to pick up new env
      jest.resetModules();
      const {
        validateCsrfOrigin: freshValidate,
      } = require('@/lib/security/csrf');

      const result = freshValidate(
        makeRequest('POST', { origin: 'https://my-app-git-main.vercel.app' }),
      );
      expect(result).toBeNull();
    });

    it('trusts VERCEL_BRANCH_URL when set', () => {
      process.env.VERCEL_BRANCH_URL = 'my-app-feature.vercel.app';

      jest.resetModules();
      const {
        validateCsrfOrigin: freshValidate,
      } = require('@/lib/security/csrf');

      const result = freshValidate(
        makeRequest('POST', { origin: 'https://my-app-feature.vercel.app' }),
      );
      expect(result).toBeNull();
    });
  });

  describe('development mode', () => {
    it('trusts localhost in development', () => {
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      const {
        validateCsrfOrigin: freshValidate,
      } = require('@/lib/security/csrf');

      const result = freshValidate(
        makeRequest('POST', { origin: 'http://localhost:3000' }),
      );
      expect(result).toBeNull();
    });

    it('trusts 127.0.0.1 in development', () => {
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      const {
        validateCsrfOrigin: freshValidate,
      } = require('@/lib/security/csrf');

      const result = freshValidate(
        makeRequest('POST', { origin: 'http://127.0.0.1:3000' }),
      );
      expect(result).toBeNull();
    });
  });
});
