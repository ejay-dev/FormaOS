/** @jest-environment node */
/**
 * Tests for app/api/v1/organizations/route.ts
 * Tests: GET handler with auth, success, and error paths.
 */

const mockAuthenticateV1Request = jest.fn();
const mockCountRows = jest.fn();
const mockLogV1Access = jest.fn();

jest.mock('@/lib/api-keys/middleware', () => {
  const { NextResponse } = require('next/server');
  return {
    __esModule: true,
    authenticateV1Request: (...args: any[]) =>
      mockAuthenticateV1Request(...args),
    createEnvelope: (data: any) => ({ data }),
    jsonWithContext: (_ctx: any, payload: any) => NextResponse.json(payload),
    logV1Access: (...args: any[]) => mockLogV1Access(...args),
  };
});

jest.mock('@/lib/api/v1-helpers', () => ({
  countRows: (...args: any[]) => mockCountRows(...args),
}));

import { GET } from '@/app/api/v1/organizations/route';

// Proxy chain mock
function chain(data: any = null) {
  const result = { data, error: null };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop in result) return (result as any)[prop];
      return (..._args: any[]) => new Proxy(result, handler);
    },
  };
  return new Proxy(result, handler);
}

describe('GET /api/v1/organizations', () => {
  beforeEach(() => {
    mockAuthenticateV1Request.mockReset();
    mockCountRows.mockReset();
    mockLogV1Access.mockResolvedValue(undefined);
    mockCountRows.mockResolvedValue(5);
    mockAuthenticateV1Request.mockResolvedValue({
      ok: true,
      context: {
        orgId: 'org-1',
        db: {
          from: jest
            .fn()
            .mockReturnValue(chain({ id: 'org-1', name: 'TestOrg' })),
        },
        keyId: 'key-1',
        scopes: ['organizations:read'],
      },
    });
  });

  it('returns organization data on success', async () => {
    const request = new Request('http://localhost/api/v1/organizations');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveProperty('stats');
    expect(body.data.stats.memberCount).toBe(5);
  });

  it('returns auth error when token invalid', async () => {
    const { NextResponse } = require('next/server');
    mockAuthenticateV1Request.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const request = new Request('http://localhost/api/v1/organizations');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
