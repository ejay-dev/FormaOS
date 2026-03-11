import { NextResponse } from 'next/server';
import {
  authenticateScimRequest,
  listGroups,
  createGroup,
} from '@/lib/scim/scim-server';

export const runtime = 'nodejs';

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

const SCIM_HEADERS = { 'Content-Type': 'application/scim+json' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
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

  const result = await listGroups(orgId, getBaseUrl(request), {
    startIndex: Number(url.searchParams.get('startIndex')) || 1,
    count: Number(url.searchParams.get('count')) || 100,
  });

  return NextResponse.json(result, { headers: SCIM_HEADERS });
}

export async function POST(request: Request) {
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json(
      {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        status: '400',
        detail: 'orgId required',
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
  const result = await createGroup(orgId, body, getBaseUrl(request));

  if ('error' in result) {
    return NextResponse.json(result.error, {
      status: result.status,
      headers: SCIM_HEADERS,
    });
  }

  return NextResponse.json(result.group, {
    status: 201,
    headers: SCIM_HEADERS,
  });
}
