const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});
afterAll(() => {
  process.env = originalEnv;
});

import { getCorsHeaders, optionsResponse } from '@/lib/api/cors';

function makeRequest(origin: string): Request {
  return {
    headers: {
      get(key: string) {
        if (key.toLowerCase() === 'origin') return origin;
        return null;
      },
    },
  } as unknown as Request;
}

describe('getCorsHeaders', () => {
  it('returns standard CORS headers', () => {
    const headers = getCorsHeaders();
    expect(headers['Access-Control-Allow-Methods']).toBe(
      'GET, POST, PUT, DELETE, OPTIONS',
    );
    expect(headers['Access-Control-Allow-Headers']).toBe(
      'Content-Type, Authorization',
    );
    expect(headers['Access-Control-Max-Age']).toBe('86400');
    expect(headers['Vary']).toBe('Origin');
  });

  it('reflects matching origin from NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com.au';
    const headers = getCorsHeaders(makeRequest('https://app.formaos.com.au'));
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://app.formaos.com.au',
    );
  });

  it('allows localhost origins', () => {
    const headers = getCorsHeaders(makeRequest('http://localhost:3000'));
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('reflects CORS_ALLOWED_ORIGINS entry', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://custom.example.com';
    const headers = getCorsHeaders(makeRequest('https://custom.example.com'));
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://custom.example.com',
    );
  });

  it('handles no request', () => {
    const headers = getCorsHeaders();
    expect(headers['Access-Control-Allow-Origin']).toBeDefined();
  });

  it('handles null request', () => {
    const headers = getCorsHeaders(null);
    expect(headers['Access-Control-Allow-Origin']).toBeDefined();
  });
});

describe('optionsResponse', () => {
  beforeAll(() => {
    if (typeof globalThis.Response === 'undefined') {
      (globalThis as any).Response = class MockResponse {
        status: number;
        headers: Map<string, string>;
        constructor(
          _body: any,
          init?: { status?: number; headers?: Record<string, string> },
        ) {
          this.status = init?.status ?? 200;
          this.headers = new Map(Object.entries(init?.headers ?? {}));
        }
      };
    }
  });

  it('returns 204 with CORS headers', () => {
    const res = optionsResponse(makeRequest('http://localhost:3000'));
    expect(res.status).toBe(204);
  });

  it('works without a request', () => {
    const res = optionsResponse();
    expect(res.status).toBe(204);
  });
});
