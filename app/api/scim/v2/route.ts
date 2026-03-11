import { NextResponse } from 'next/server';
import {
  authenticateScimRequest,
  listUsers,
  createUser,
  getServiceProviderConfig,
  getResourceTypes,
} from '@/lib/scim/scim-server';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getOrgId(request: Request): string | null {
  const url = new URL(request.url);
  return url.searchParams.get('orgId');
}

const SCIM_HEADERS = { 'Content-Type': 'application/scim+json' };

// GET /api/scim/v2 — ServiceProviderConfig, ResourceTypes, or Users list
export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');

  // Discovery endpoints don't require auth
  if (resource === 'ServiceProviderConfig') {
    return NextResponse.json(getServiceProviderConfig(baseUrl), {
      headers: SCIM_HEADERS,
    });
  }
  if (resource === 'ResourceTypes') {
    return NextResponse.json(getResourceTypes(baseUrl), {
      headers: SCIM_HEADERS,
    });
  }

  // User/Group list requires auth
  const orgId = getOrgId(request);
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId query param required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const result = await listUsers(orgId, baseUrl, {
    startIndex: Number(url.searchParams.get('startIndex')) || 1,
    count: Number(url.searchParams.get('count')) || 100,
    filter: url.searchParams.get('filter') ?? undefined,
  });

  return NextResponse.json(result, { headers: SCIM_HEADERS });
}

// POST /api/scim/v2 — Create User
export async function POST(request: Request) {
  const orgId = getOrgId(request);
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId query param required',
      },
      { status: 400, headers: SCIM_HEADERS },
    );
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: SCIM_HEADERS,
    });
  }

  const body = await request.json();
  const baseUrl = getBaseUrl(request);
  const result = await createUser(orgId, body, baseUrl);

  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return NextResponse.json(result.user, { status: 201, headers: SCIM_HEADERS });
}
