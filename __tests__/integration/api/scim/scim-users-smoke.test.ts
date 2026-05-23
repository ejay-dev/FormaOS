/** @jest-environment node */
/**
 * SCIM /Users smoke — v4-028. The 8 SCIM v2 routes had zero
 * request-level test coverage prior to this; only the underlying
 * lib/scim/* unit tests existed. This file covers the auth boundary
 * for the Users collection (GET list + POST create) which is the
 * payload IdPs hit most.
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/scim/scim-auth', () => ({
  authenticateScimRequest: jest.fn(),
  scimError: (status: number, detail: string) => ({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
    status: String(status),
    detail,
  }),
  auditScimOperation: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/scim/scim-server', () => ({
  listUsers: jest.fn(),
  createUser: jest.fn(),
  getScimContentHeaders: () => ({ 'content-type': 'application/scim+json' }),
}));

import { GET, POST } from '@/app/api/scim/v2/Users/route';
import { authenticateScimRequest } from '@/lib/scim/scim-auth';
import { listUsers, createUser } from '@/lib/scim/scim-server';

const mockAuth = authenticateScimRequest as jest.Mock;
const mockList = listUsers as jest.Mock;
const mockCreate = createUser as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

function request(
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  return new Request(
    'https://app.formaos.com.au/api/scim/v2/Users?orgId=org-1',
    {
      method,
      headers: {
        'content-type': 'application/scim+json',
        authorization: 'Bearer scim-test-token',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

const okAuth = () => ({
  ok: true,
  context: { tokenLabel: 'test-token', headers: {} },
});

describe('GET /api/scim/v2/Users', () => {
  it('returns 401 when SCIM auth rejects', async () => {
    mockAuth.mockResolvedValueOnce({
      ok: false,
      status: 401,
      error: { detail: 'unauthorized' },
      headers: {},
    });
    const res = await GET(request('GET'));
    expect(res.status).toBe(401);
  });

  it('returns a SCIM ListResponse on success', async () => {
    mockAuth.mockResolvedValueOnce(okAuth());
    mockList.mockResolvedValueOnce({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      Resources: [{ id: 'u1', userName: 'user@example.com' }],
      totalResults: 1,
      startIndex: 1,
      itemsPerPage: 1,
    });
    const res = await GET(request('GET'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.Resources).toHaveLength(1);
  });
});

describe('POST /api/scim/v2/Users', () => {
  it('returns 401 when SCIM auth rejects', async () => {
    mockAuth.mockResolvedValueOnce({
      ok: false,
      status: 401,
      error: { detail: 'unauthorized' },
      headers: {},
    });
    const res = await POST(request('POST', { userName: 'new@example.com' }));
    expect(res.status).toBe(401);
  });

  it('creates a user and returns 201', async () => {
    mockAuth.mockResolvedValueOnce(okAuth());
    mockCreate.mockResolvedValueOnce({
      status: 201,
      data: {
        id: 'new-user-1',
        userName: 'new@example.com',
        active: true,
        meta: { version: 'W/"1"' },
      },
    });
    const res = await POST(
      request('POST', {
        userName: 'new@example.com',
        name: { formatted: 'New User' },
        active: true,
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('new-user-1');
  });

  it('surfaces SCIM error envelope when createUser refuses', async () => {
    mockAuth.mockResolvedValueOnce(okAuth());
    mockCreate.mockResolvedValueOnce({
      status: 400,
      error: { detail: 'userName is required', status: '400' },
    });
    const res = await POST(request('POST', { active: true }));
    expect(res.status).toBe(400);
  });
});

// Returns 400 when orgId query param is missing (route-level
// guard, independent of SCIM auth).
describe('GET /api/scim/v2/Users without orgId', () => {
  it('returns 400', async () => {
    const res = await GET(
      new Request('https://app.formaos.com.au/api/scim/v2/Users', {
        method: 'GET',
        headers: { authorization: 'Bearer x' },
      }),
    );
    expect(res.status).toBe(400);
  });
});
