import { NextResponse } from 'next/server';
import { getScimContentHeaders, listUsers, createUser } from '@/lib/scim/scim-server';
import { getResourceTypes, getServiceProviderConfig } from '@/lib/scim/scim-schemas';
import { authenticateScimRequest, scimError } from '@/lib/scim/scim-auth';

export const runtime = 'nodejs';

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = getBaseUrl(request);
  const resource = url.searchParams.get('resource');

  if (resource === 'ServiceProviderConfig') {
    return NextResponse.json(getServiceProviderConfig(baseUrl), {
      headers: getScimContentHeaders(),
    });
  }

  if (resource === 'ResourceTypes') {
    return NextResponse.json(getResourceTypes(baseUrl), {
      headers: getScimContentHeaders(),
    });
  }

  const orgId = url.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(scimError(400, 'orgId query param required'), {
      status: 400,
      headers: getScimContentHeaders(),
    });
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: getScimContentHeaders(auth.headers),
    });
  }

  const payload = await listUsers(orgId, baseUrl, {
    startIndex: Number(url.searchParams.get('startIndex')) || 1,
    count: Number(url.searchParams.get('count')) || 100,
    filter: url.searchParams.get('filter'),
    sortBy: url.searchParams.get('sortBy'),
    sortOrder: url.searchParams.get('sortOrder'),
  });

  return NextResponse.json(payload, {
    headers: getScimContentHeaders(auth.context.headers),
  });
}

export async function POST(request: Request) {
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(scimError(400, 'orgId query param required'), {
      status: 400,
      headers: getScimContentHeaders(),
    });
  }

  const auth = await authenticateScimRequest(request, orgId);
  if (!auth.ok) {
    return NextResponse.json(auth.error, {
      status: auth.status,
      headers: getScimContentHeaders(auth.headers),
    });
  }

  const result = await createUser(orgId, (await request.json()) as Record<string, unknown>, getBaseUrl(request));
  if (result.error) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: getScimContentHeaders(auth.context.headers),
    });
  }

  return NextResponse.json(result.data, {
    status: result.status,
    headers: getScimContentHeaders({
      ...auth.context.headers,
      ETag: result.data!.meta.version,
    }),
  });
}
